import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const trackSchema = z.object({
  orderNo: z.string().min(3, 'Order number is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`track_${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many tracking attempts. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = trackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid order number and phone number.' },
        { status: 400 }
      );
    }

    const { orderNo, phone } = result.data;
    const cleanPhone = phone.replace(/[^\d]/g, '');

    // Search strictly by orderNo AND matching phone
    const order = await db.order.findUnique({
      where: { orderNo: orderNo.trim() },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Security check: Phone must match recipient phone
    if (!order || !order.shippingPhone.includes(cleanPhone.slice(-10))) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No order found matching the provided order number and phone number. Please check your details.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNo: order.orderNo,
        status: order.status,
        createdAt: order.createdAt,
        shippingName: order.shippingName,
        shippingDistrict: order.shippingDistrict,
        shippingArea: order.shippingArea,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        total: order.total,
        items: order.items.map((i) => ({
          id: i.id,
          name: i.nameSnapshot,
          size: i.sizeSnapshot,
          color: i.colorSnapshot,
          price: i.priceSnapshot,
          qty: i.qty,
          image: i.imageSnapshot,
        })),
        statusHistory: order.statusHistory.map((h) => ({
          status: h.status,
          note: h.note,
          createdAt: h.createdAt,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Tracking API error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while tracking order.' },
      { status: 500 }
    );
  }
}
