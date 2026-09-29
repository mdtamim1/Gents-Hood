import { db } from '../src/lib/db';
import { createOrder } from '../src/lib/services/order.service';

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING PHASE 3 ORDER SERVICE TESTS');
  console.log('========================================\n');

  // Find a product and variant to test with
  const product = await db.product.findFirst({
    where: { status: 'ACTIVE' },
    include: { variants: true },
  });

  if (!product || product.variants.length === 0) {
    throw new Error('No product or variant found for testing.');
  }

  const variant = product.variants[0];
  const initialStock = variant.stock;
  console.log(
    `Testing with product: "${product.name}", Variant: ${variant.size}/${variant.color}, Initial Stock: ${initialStock}`
  );

  const idempotencyKey = `TEST-IDEM-${Date.now()}`;

  // TEST 1: Normal Order Placement & Stock Decrement
  console.log('\n--- TEST 1: Stock Decrement on Order ---');
  const order1 = await createOrder({
    shippingName: 'Tamim Test User',
    shippingPhone: '01712345678',
    shippingDistrict: 'Dhaka',
    shippingArea: 'Gulshan',
    shippingAddress: 'House 12, Road 4',
    idempotencyKey,
    paymentMethod: 'COD',
    items: [
      {
        productId: product.id,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        quantity: 2,
      },
    ],
  });

  const updatedVariant = await db.productVariant.findUnique({
    where: { id: variant.id },
  });

  if (!updatedVariant || updatedVariant.stock !== initialStock - 2) {
    throw new Error(`FAIL: Expected stock ${initialStock - 2}, but got ${updatedVariant?.stock}`);
  }
  console.log(
    `✓ PASS: Stock successfully decremented from ${initialStock} to ${updatedVariant.stock}`
  );
  console.log(`✓ Order created with OrderNo: ${order1.orderNo}`);

  // TEST 2: Idempotency Protection (Duplicate key should return same order without decreasing stock)
  console.log('\n--- TEST 2: Idempotency Key Duplicate Order Prevention ---');
  const duplicateOrder = await createOrder({
    shippingName: 'Tamim Test User Duplicate',
    shippingPhone: '01712345678',
    shippingDistrict: 'Dhaka',
    shippingArea: 'Gulshan',
    shippingAddress: 'House 12, Road 4',
    idempotencyKey, // SAME KEY
    paymentMethod: 'COD',
    items: [
      {
        productId: product.id,
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        quantity: 2,
      },
    ],
  });

  if (duplicateOrder.id !== order1.id) {
    throw new Error('FAIL: Duplicate order was created instead of returning existing order.');
  }

  const stockAfterDuplicate = await db.productVariant.findUnique({
    where: { id: variant.id },
  });

  if (stockAfterDuplicate?.stock !== updatedVariant.stock) {
    throw new Error(`FAIL: Stock was decremented again on duplicate order!`);
  }
  console.log(
    '✓ PASS: Idempotent request returned existing order without decrementing stock again.'
  );

  // TEST 3: Oversell Prevention
  console.log('\n--- TEST 3: Oversell Prevention ---');
  const currentStock = stockAfterDuplicate.stock;
  let oversellPrevented = false;

  try {
    await createOrder({
      shippingName: 'Oversell Tester',
      shippingPhone: '01799999999',
      shippingDistrict: 'Chittagong',
      shippingArea: 'Agrabad',
      shippingAddress: 'Port Road 1',
      idempotencyKey: `OVERSELL-${Date.now()}`,
      paymentMethod: 'COD',
      items: [
        {
          productId: product.id,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          quantity: currentStock + 50, // Much more than available stock
        },
      ],
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('Insufficient stock')) {
      oversellPrevented = true;
      console.log(`✓ PASS: Oversell prevented with message: "${errorMsg}"`);
    } else {
      throw err;
    }
  }

  if (!oversellPrevented) {
    throw new Error('FAIL: Oversell was NOT prevented!');
  }

  // Cleanup test order
  console.log('\n--- Cleaning up test records ---');
  await db.orderItem.deleteMany({ where: { orderId: order1.id } });
  await db.orderStatusHistory.deleteMany({ where: { orderId: order1.id } });
  await db.order.delete({ where: { id: order1.id } });

  // Restore stock
  await db.productVariant.update({
    where: { id: variant.id },
    data: { stock: initialStock },
  });
  console.log(`✓ Restored original stock to ${initialStock}`);

  console.log('\n🎉 ALL PHASE 3 ORDER SERVICE UNIT TESTS PASSED SUCCESSFULLY!\n');
}

runTests()
  .catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
