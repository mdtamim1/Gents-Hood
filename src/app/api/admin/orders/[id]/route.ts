import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const updateOrderSchema = z.object({
  status: z
    .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'RETURNED'])
    .optional(),
  note: z.string().optional().nullable(),
  shopNote: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  courierName: z.string().optional().nullable(),
  courierTrackingNo: z.string().optional().nullable(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  shippingName: z.string().optional(),
  shippingPhone: z.string().optional(),
  shippingDistrict: z.string().optional(),
  shippingThana: z.string().optional(),
  shippingArea: z.string().optional(),
  shippingAddress: z.string().optional(),
  manualDiscount: z.number().optional(),
  paidAmount: z.number().optional(),
  deliveryCharge: z.number().optional(),
  activityNote: z.string().optional(),
});

// GET: Single order
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        activityLogs: { orderBy: { createdAt: 'desc' } },
        assignedTo: { select: { id: true, name: true, email: true, displayColor: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (session.role !== 'OWNER' && order.assignedToId !== session.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get order' }, { status: 500 });
  }
}

// PATCH: Update order
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = updateOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (session.role !== 'OWNER' && order.assignedToId !== session.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { status, activityNote, assignedToId, ...restUpdate } = result.data;
    const updateData: Record<string, unknown> = { ...restUpdate };

    if (restUpdate.manualDiscount !== undefined || restUpdate.deliveryCharge !== undefined) {
      const newDelivery = restUpdate.deliveryCharge ?? order.deliveryCharge;
      const newManualDiscount = restUpdate.manualDiscount ?? order.manualDiscount;
      updateData.total = order.subtotal + newDelivery - newManualDiscount - order.discount;
    }

    const activityLogsData: Array<{
      orderId: string;
      adminId: string;
      adminName: string;
      action: string;
      oldValue?: string;
      newValue?: string;
      note?: string;
    }> = [];

    if (status && status !== order.status) {
      updateData.status = status;
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status,
          note: activityNote || `Status changed to ${status}`,
          adminId: session.id,
          adminName: session.name,
        },
      });

      activityLogsData.push({
        orderId: params.id,
        adminId: session.id,
        adminName: session.name,
        action: 'STATUS_CHANGED',
        oldValue: order.status,
        newValue: status,
        note: activityNote,
      });
    }

    if (assignedToId !== undefined && session.role === 'OWNER') {
      updateData.assignedToId = assignedToId;
      if (assignedToId && assignedToId !== order.assignedToId) {
        const newAssignee = await db.adminUser.findUnique({
          where: { id: assignedToId },
          select: { name: true },
        });
        activityLogsData.push({
          orderId: params.id,
          adminId: session.id,
          adminName: session.name,
          action: 'ASSIGNED',
          oldValue: order.assignedToId || 'Unassigned',
          newValue: newAssignee?.name || assignedToId,
          note: `Reassigned by ${session.name}`,
        });
      }
    }

    if (activityNote && !status) {
      activityLogsData.push({
        orderId: params.id,
        adminId: session.id,
        adminName: session.name,
        action: 'NOTE_ADDED',
        note: activityNote,
      });
    }

    const editableFields = [
      'shippingName',
      'shippingPhone',
      'shippingAddress',
      'shippingDistrict',
      'shippingThana',
      'shippingArea',
    ];
    const hasEdits = editableFields.some(
      (f) => (restUpdate as Record<string, unknown>)[f] !== undefined
    );
    if (hasEdits) {
      activityLogsData.push({
        orderId: params.id,
        adminId: session.id,
        adminName: session.name,
        action: 'EDITED',
        note: `Order details updated by ${session.name}`,
      });
    }

    await db.$transaction([
      db.order.update({
        where: { id: params.id },
        data: updateData,
      }),
      ...activityLogsData.map((log) => db.orderActivityLog.create({ data: log })),
    ]);

    const updatedOrder = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
        assignedTo: { select: { id: true, name: true, displayColor: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
