import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const reviewAppealSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  adminNote: z.string().optional(),
});

// PATCH: Admin review appeal (Approve or Reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminAccess('orders');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Orders permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    // Only OWNER can approve/reject appeals
    if (auth.user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can approve or reject appeals' },
        { status: 403 }
      );
    }

    const session = auth.session;
    const body = await request.json();
    const result = reviewAppealSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { action, adminNote } = result.data;

    const appeal = await db.orderAppeal.findUnique({
      where: { id: params.id },
      include: {
        order: true,
        staff: { select: { id: true, name: true, displayColor: true } },
      },
    });

    if (!appeal) {
      return NextResponse.json({ success: false, error: 'Appeal not found' }, { status: 404 });
    }

    const now = new Date();

    if (action === 'APPROVE') {
      // 1. Mark appeal as APPROVED
      // 2. Set order status to PROCESSING
      // 3. Assign order to the staff who appealed (so it goes to that staff's processing!)
      // 4. Set order appealStatus to APPROVED
      // 5. Add order status history and activity log
      await db.$transaction([
        db.orderAppeal.update({
          where: { id: params.id },
          data: {
            status: 'APPROVED',
            adminNote: adminNote || null,
            adminName: session.name,
            reviewedAt: now,
          },
        }),
        db.order.update({
          where: { id: appeal.orderId },
          data: {
            status: 'PROCESSING',
            assignedToId: appeal.staffId,
            appealStatus: 'APPROVED',
            updatedAt: now,
          },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: appeal.orderId,
            status: 'PROCESSING',
            note: `Appeal approved by Admin. Assigned to ${appeal.staffName} for order processing. ${adminNote ? `(Note: ${adminNote})` : ''}`,
            adminId: session.id,
            adminName: session.name,
          },
        }),
        db.orderActivityLog.create({
          data: {
            orderId: appeal.orderId,
            adminId: session.id,
            adminName: session.name,
            action: 'APPEAL_APPROVED',
            oldValue: 'PENDING_APPEAL',
            newValue: `PROCESSING → Assigned to ${appeal.staffName}`,
            note: adminNote || `Admin approved appeal and dispatched order to ${appeal.staffName}'s processing panel`,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Appeal approved! Order ${appeal.order.orderNo} is now set to PROCESSING and assigned to staff ${appeal.staffName}.`,
      });
    } else {
      // REJECT
      await db.$transaction([
        db.orderAppeal.update({
          where: { id: params.id },
          data: {
            status: 'REJECTED',
            adminNote: adminNote || 'Appeal rejected after review',
            adminName: session.name,
            reviewedAt: now,
          },
        }),
        db.order.update({
          where: { id: appeal.orderId },
          data: {
            appealStatus: 'REJECTED',
          },
        }),
        db.orderActivityLog.create({
          data: {
            orderId: appeal.orderId,
            adminId: session.id,
            adminName: session.name,
            action: 'APPEAL_REJECTED',
            oldValue: 'PENDING_APPEAL',
            newValue: 'REJECTED',
            note: adminNote || 'Admin rejected the appeal after verification',
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Appeal for order ${appeal.order.orderNo} has been rejected.`,
      });
    }
  } catch (error) {
    console.error('Review appeal error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process appeal review' }, { status: 500 });
  }
}
