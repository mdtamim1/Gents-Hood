import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/audit.service';

const updateOrderSchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .optional(),
  note: z.string().optional(),
});

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
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error('Failed to get order details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve order' },
      { status: 500 }
    );
  }
}

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
        { success: false, error: result.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const { status, note } = result.data;

    const currentOrder = await db.order.findUnique({
      where: { id: params.id },
    });

    if (!currentOrder) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      // 1. If status changed, create StatusHistory entry
      if (status && status !== currentOrder.status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: params.id,
            status,
            note: note || `Status updated to ${status} by admin (${session.email})`,
          },
        });
      }

      // 2. Update Order
      return tx.order.update({
        where: { id: params.id },
        data: {
          status: status || currentOrder.status,
          note: note !== undefined ? note : currentOrder.note,
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });
    });

    await createAuditLog({
      adminId: session.id,
      action: 'UPDATE_ORDER_STATUS',
      entity: 'Order',
      entityId: params.id,
      meta: {
        orderNo: currentOrder.orderNo,
        oldStatus: currentOrder.status,
        newStatus: updated.status,
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: unknown) {
    console.error('Failed to update order status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
