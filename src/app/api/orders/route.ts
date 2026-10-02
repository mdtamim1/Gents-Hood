import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createOrderSchema } from '@/lib/validators';
import { createOrder } from '@/lib/services/order.service';
import { rateLimit } from '@/lib/rate-limit';
import { sendServerCapiEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    // 1. Basic rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`order_${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many order attempts. Please wait a few minutes before trying again.',
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate body with Zod
    const body = await request.json();
    const validationResult = createOrderSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError =
        validationResult.error.errors[0]?.message || 'Invalid order data provided.';
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 3. Create Order via transactional service
    const order = await createOrder(validationResult.data);

    // 4. Dispatch server-side Conversions API (CAPI) event asynchronously
    sendServerCapiEvent('Purchase', {
      orderId: order.orderNo,
      value: order.total,
      currency: 'BDT',
      clientIp: ip,
      phone: order.shippingPhone,
      userAgent: request.headers.get('user-agent') || undefined,
    }).catch(() => {});

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNo: order.orderNo,
          subtotal: order.subtotal,
          deliveryCharge: order.deliveryCharge,
          total: order.total,
          shippingName: order.shippingName,
          shippingPhone: order.shippingPhone,
          shippingDistrict: order.shippingDistrict,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process order';
    console.error('Order creation error:', error);

    // Return friendly error to client
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
