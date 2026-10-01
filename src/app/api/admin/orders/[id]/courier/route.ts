import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const courierSchema = z.object({
  courierName: z.string().min(1, 'Courier name is required'),
  courierTrackingNo: z.string().optional(),
});

// POST: Enter courier for an order (disables the button after)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminAccess('orders');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Orders permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }
    const session = auth.session;

    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (order.courierEntryDone) {
      return NextResponse.json(
        { success: false, error: 'Courier entry already done for this order' },
        { status: 400 }
      );
    }

    // Staff can only update their assigned orders
    if (session.role !== 'OWNER' && order.assignedToId !== session.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = courierSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { courierName, courierTrackingNo } = result.data;

    await db.order.update({
      where: { id: params.id },
      data: {
        courierEntryDone: true,
        courierEntryAt: new Date(),
        courierName,
        courierTrackingNo: courierTrackingNo || null,
        status: 'SHIPPED',
      },
    });

    await db.orderStatusHistory.create({
      data: {
        orderId: params.id,
        status: 'SHIPPED',
        note: `Courier entry done via ${courierName}${courierTrackingNo ? ` (Tracking: ${courierTrackingNo})` : ''}`,
        adminId: session.id,
        adminName: session.name,
      },
    });

    await db.orderActivityLog.create({
      data: {
        orderId: params.id,
        adminId: session.id,
        adminName: session.name,
        action: 'COURIER_ENTERED',
        newValue: `${courierName}${courierTrackingNo ? ` - ${courierTrackingNo}` : ''}`,
        note: `Courier entry submitted by ${session.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Courier entry saved successfully',
    });
  } catch (error) {
    console.error('Courier entry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save courier entry' },
      { status: 500 }
    );
  }
}
