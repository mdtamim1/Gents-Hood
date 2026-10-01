import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const createAppealSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  reason: z.string().min(1, 'Reason / issue type is required'),
  note: z.string().min(5, 'Detailed note must be at least 5 characters'),
  customerPhone: z.string().optional(),
});

// GET: List all appeals
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess('orders');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Orders permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const session = auth.session;
    const user = auth.user;
    const isOwner = user.role === 'OWNER';

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const whereClause: Record<string, unknown> = {};

    // Staff can ONLY see appeals submitted by themselves. Admin (Owner) sees all appeals.
    if (!isOwner) {
      whereClause.staffId = session.id;
    }

    if (status !== 'ALL') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { reason: { contains: search } },
        { note: { contains: search } },
        { staffName: { contains: search } },
        { customerPhone: { contains: search } },
        { order: { orderNo: { contains: search } } },
        { order: { shippingName: { contains: search } } },
        { order: { shippingPhone: { contains: search } } },
      ];
    }

    const countWhere = isOwner ? {} : { staffId: session.id };

    const [appeals, counts] = await Promise.all([
      db.orderAppeal.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              orderNo: true,
              status: true,
              total: true,
              shippingName: true,
              shippingPhone: true,
              shippingDistrict: true,
              shippingAddress: true,
              assignedToId: true,
              assignedTo: { select: { id: true, name: true, displayColor: true } },
              createdAt: true,
            },
          },
          staff: {
            select: { id: true, name: true, displayColor: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      // Status breakdown
      (async () => {
        const [pending, approved, rejected, all] = await Promise.all([
          db.orderAppeal.count({ where: { ...countWhere, status: 'PENDING' } }),
          db.orderAppeal.count({ where: { ...countWhere, status: 'APPROVED' } }),
          db.orderAppeal.count({ where: { ...countWhere, status: 'REJECTED' } }),
          db.orderAppeal.count({ where: countWhere }),
        ]);
        return { pending, approved, rejected, all };
      })(),
    ]);

    return NextResponse.json({
      success: true,
      appeals,
      counts,
    });
  } catch (error) {
    console.error('Fetch appeals error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch appeals' }, { status: 500 });
  }
}

// POST: Submit a new order appeal
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess('orders');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Orders permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }
    const session = auth.session;
    const user = auth.user;

    const body = await request.json();
    const result = createAppealSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { orderId, reason, note, customerPhone } = result.data;

    // Check order existence
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // CRITICAL: Check if already appealed (prevent duplicate appeals while pending)
    const existingPending = await db.orderAppeal.findFirst({
      where: {
        orderId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          success: false,
          error: `Order ${order.orderNo} is already under appeal review by ${existingPending.staffName}. It cannot be appealed again until the admin verifies and resolves the existing appeal.`,
        },
        { status: 400 }
      );
    }

    // Create the appeal and update order
    const [appeal] = await db.$transaction([
      db.orderAppeal.create({
        data: {
          orderId,
          staffId: session.id,
          staffName: user.name,
          staffColor: user.role === 'OWNER' ? '#f59e0b' : '#6366f1',
          reason,
          note,
          customerPhone: customerPhone || order.shippingPhone,
          status: 'PENDING',
        },
      }),
      db.order.update({
        where: { id: orderId },
        data: {
          appealStatus: 'PENDING',
        },
      }),
      db.orderActivityLog.create({
        data: {
          orderId,
          adminId: session.id,
          adminName: user.name,
          action: 'APPEAL_SUBMITTED',
          oldValue: order.appealStatus || 'NONE',
          newValue: 'PENDING',
          note: `Staff ${user.name} submitted an Appeal [Reason: ${reason}]. Note: ${note}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Appeal for order ${order.orderNo} successfully submitted for Admin verification.`,
      appeal,
    });
  } catch (error) {
    console.error('Submit appeal error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit appeal' }, { status: 500 });
  }
}
