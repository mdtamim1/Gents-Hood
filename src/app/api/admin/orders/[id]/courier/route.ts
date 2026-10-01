import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';
import { createSteadfastOrder } from '@/lib/services/steadfast.service';

export const dynamic = 'force-dynamic';

const courierSchema = z.object({
  courierName: z.string().default('Steadfast'),
  courierTrackingNo: z.string().optional(),
  autoCreateSteadfast: z.boolean().optional(),
});

// POST: Enter courier for an order (supports 1-click Steadfast API entry)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminAccess('orders');
    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.reason === 'forbidden' ? 'Forbidden: Orders permission required' : 'Unauthorized',
        },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }
    const session = auth.session;

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

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

    const body = await request.json().catch(() => ({}));
    const result = courierSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { courierName, courierTrackingNo, autoCreateSteadfast } = result.data;
    let finalTrackingNo = courierTrackingNo || null;
    let finalCourierName = courierName;
    let consignmentId: number | null = null;

    // Automated Steadfast Courier Entry
    if (autoCreateSteadfast || (courierName === 'Steadfast' && !courierTrackingNo)) {
      finalCourierName = 'Steadfast';

      const fullAddress = [
        order.shippingAddress,
        order.shippingArea,
        order.shippingThana,
        order.shippingDistrict,
      ]
        .filter(Boolean)
        .join(', ');

      const codAmount =
        order.paymentStatus === 'PAID' ? 0 : Math.max(0, order.total - order.paidAmount);

      const itemsDesc = (order.items || [])
        .map((i) => `${i.nameSnapshot}${i.sizeSnapshot ? ` (${i.sizeSnapshot})` : ''} x${i.qty}`)
        .join(', ');

      const sfResult = await createSteadfastOrder({
        invoice: order.orderNo,
        recipientName: order.shippingName,
        recipientPhone: order.shippingPhone,
        recipientAddress: fullAddress || order.shippingDistrict || 'Dhaka, Bangladesh',
        codAmount,
        note: order.note || order.shopNote || undefined,
        itemDescription: itemsDesc || undefined,
      });

      if (!sfResult.success) {
        return NextResponse.json(
          { success: false, error: sfResult.error || 'Steadfast API submission failed' },
          { status: 400 }
        );
      }

      finalTrackingNo = sfResult.trackingCode || null;
      consignmentId = sfResult.consignmentId || null;
    }

    await db.order.update({
      where: { id: params.id },
      data: {
        courierEntryDone: true,
        courierEntryAt: new Date(),
        courierName: finalCourierName,
        courierTrackingNo: finalTrackingNo,
        status: 'SHIPPED',
      },
    });

    const noteDetails = [
      `Courier: ${finalCourierName}`,
      finalTrackingNo ? `Tracking: ${finalTrackingNo}` : null,
      consignmentId ? `Consignment ID: ${consignmentId}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    await db.orderStatusHistory.create({
      data: {
        orderId: params.id,
        status: 'SHIPPED',
        note: `Courier entry done via ${noteDetails}`,
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
        newValue: noteDetails,
        note: `Courier entry submitted by ${session.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Courier entry saved successfully${finalTrackingNo ? ` (Tracking: ${finalTrackingNo})` : ''}`,
      trackingNo: finalTrackingNo,
      consignmentId,
    });
  } catch (error) {
    console.error('Courier entry error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save courier entry' },
      { status: 500 }
    );
  }
}
