import { db } from '@/lib/db';
import { CreateOrderInput } from '@/lib/validators';
import { getSiteSettings } from './settings.service';

/**
 * Generate a unique sequential order number formatted as GH-YYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `GH-${year}${month}${day}-${randomSuffix}`;
}

/**
 * Create a new customer order with atomic transaction, stock validation, and price verification
 */
export async function createOrder(input: CreateOrderInput) {
  // 1. Idempotency check: Return existing order if key matches
  const existingOrder = await db.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true, statusHistory: true },
  });

  if (existingOrder) {
    return existingOrder;
  }

  // 2. Fetch site settings for delivery fee calculation
  const settings = await getSiteSettings();
  let insideDhakaFee = 70;
  let outsideDhakaFee = 130;
  const freeThreshold = settings.freeDeliveryMin || 1999;

  if (settings.deliveryCharges) {
    try {
      const parsed = JSON.parse(settings.deliveryCharges);
      insideDhakaFee = parsed.insideDhaka ?? insideDhakaFee;
      outsideDhakaFee = parsed.outsideDhaka ?? outsideDhakaFee;
    } catch {
      // Use defaults if parse fails
    }
  }

  // 3. Execute atomic transaction
  return await db.$transaction(async (tx) => {
    let subtotal = 0;
    const verifiedItems: {
      productId: string;
      variantId?: string;
      nameSnapshot: string;
      sizeSnapshot?: string;
      colorSnapshot?: string;
      priceSnapshot: number;
      qty: number;
      imageSnapshot?: string;
    }[] = [];

    // Verify products, compute price strictly from DB, check & decrement stock
    for (const item of input.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 },
          variants: true,
        },
      });

      if (!product) {
        throw new Error(`Product with ID "${item.productId}" was not found.`);
      }

      if (product.status !== 'ACTIVE') {
        throw new Error(`Product "${product.name}" is no longer available.`);
      }

      let price = product.price;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Selected variant not found for "${product.name}".`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}" (${variant.size} / ${variant.color}). Available: ${variant.stock}.`
          );
        }

        // Atomic stock decrement
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });

        if (variant.priceOverride) {
          price = variant.priceOverride;
        }
      } else if (item.size || item.color) {
        // Find variant by size/color if variantId not directly provided
        const variant = product.variants.find(
          (v) => (!item.size || v.size === item.size) && (!item.color || v.color === item.color)
        );

        if (variant) {
          if (variant.stock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}" (${variant.size} / ${variant.color}). Available: ${variant.stock}.`
            );
          }

          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { decrement: item.quantity } },
          });

          if (variant.priceOverride) {
            price = variant.priceOverride;
          }
        }
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      verifiedItems.push({
        productId: product.id,
        variantId: item.variantId,
        nameSnapshot: product.name,
        sizeSnapshot: item.size,
        colorSnapshot: item.color,
        priceSnapshot: price,
        qty: item.quantity,
        imageSnapshot: product.images[0]?.url || '/images/new-vibes-main.jpg',
      });
    }

    // Determine delivery charge
    const isDhaka =
      input.shippingDistrict.toLowerCase().includes('dhaka') ||
      input.shippingArea.toLowerCase().includes('dhaka');
    let deliveryCharge = isDhaka ? insideDhakaFee : outsideDhakaFee;

    // Free delivery threshold
    if (subtotal >= freeThreshold) {
      deliveryCharge = 0;
    }

    const total = subtotal + deliveryCharge;
    const orderNo = generateOrderNumber();

    // 4. Create Order Record
    const order = await tx.order.create({
      data: {
        orderNo,
        status: 'PENDING',
        paymentMethod: input.paymentMethod || 'COD',
        paymentStatus: 'UNPAID',
        subtotal,
        deliveryCharge,
        discount: 0,
        total,
        shippingName: input.shippingName,
        shippingPhone: input.shippingPhone,
        shippingDistrict: input.shippingDistrict,
        shippingArea: input.shippingArea,
        shippingAddress: input.shippingAddress,
        note: input.note,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: verifiedItems.map((vi) => ({
            productId: vi.productId,
            variantId: vi.variantId,
            nameSnapshot: vi.nameSnapshot,
            sizeSnapshot: vi.sizeSnapshot,
            colorSnapshot: vi.colorSnapshot,
            priceSnapshot: vi.priceSnapshot,
            qty: vi.qty,
            imageSnapshot: vi.imageSnapshot,
          })),
        },
        statusHistory: {
          create: {
            status: 'PENDING',
            note: 'Order placed by customer via Cash on Delivery',
          },
        },
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });

    return order;
  });
}

/**
 * Track order by Order Number and Phone Number
 */
export async function trackOrder(orderNo: string, phone: string) {
  const cleanPhone = phone.replace(/[^\d]/g, '');

  const order = await db.order.findFirst({
    where: {
      orderNo: orderNo.trim(),
      shippingPhone: { contains: cleanPhone.slice(-10) },
    },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });

  return order;
}
