import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const accountLookupSchema = z.object({
  phone: z.string().min(10, 'Valid 11-digit mobile number is required'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = await rateLimit(`account_${ip}`);
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = accountLookupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid mobile number.' },
        { status: 400 }
      );
    }

    const cleanPhone = result.data.phone.replace(/[^\d]/g, '');

    const orders = await db.order.findMany({
      where: {
        shippingPhone: {
          contains: cleanPhone.slice(-10),
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        shippingName: o.shippingName,
        itemCount: o.items.reduce((acc, i) => acc + i.qty, 0),
        items: o.items.map((i) => ({
          name: i.nameSnapshot,
          size: i.sizeSnapshot,
          qty: i.qty,
          image: i.imageSnapshot,
        })),
      })),
    });
  } catch (error: unknown) {
    console.error('Account orders API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve order history.' },
      { status: 500 }
    );
  }
}
