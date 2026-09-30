import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/orders/sync
 * Moves all PENDING orders to PROCESSING and distributes them among online staff
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get all pending orders
    const pendingOrders = await db.order.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending orders to sync',
        synced: 0,
      });
    }

    // Get active staff (online within last 5 minutes)
    const activeSessions = await db.staffSession.findMany({
      where: {
        isActive: true,
        lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      include: {
        staff: {
          select: { id: true, name: true, role: true, isActive: true },
        },
      },
    });

    const onlineStaff = activeSessions
      .filter((s) => s.staff.isActive && s.staff.role === 'STAFF')
      .map((s) => s.staff);

    // Remove duplicates
    const uniqueStaff = Array.from(new Map(onlineStaff.map((s) => [s.id, s])).values());

    let assignees: Array<{ id: string; name: string }>;

    if (uniqueStaff.length === 0) {
      // No online staff → assign all to admin who clicked sync
      assignees = [{ id: session.id, name: session.name }];
    } else {
      assignees = uniqueStaff;
    }

    const now = new Date();
    const updatedOrders: string[] = [];

    // Distribute orders round-robin
    for (let i = 0; i < pendingOrders.length; i++) {
      const order = pendingOrders[i];
      const assignee = assignees[i % assignees.length];

      await db.order.update({
        where: { id: order.id },
        data: {
          status: 'PROCESSING',
          syncedAt: now,
          assignedToId: assignee.id,
        },
      });

      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PROCESSING',
          note: `Synced and assigned to ${assignee.name}`,
          adminId: session.id,
          adminName: session.name,
        },
      });

      await db.orderActivityLog.create({
        data: {
          orderId: order.id,
          adminId: session.id,
          adminName: session.name,
          action: 'ASSIGNED',
          oldValue: 'PENDING',
          newValue: `PROCESSING → ${assignee.name}`,
          note: `Assigned to ${assignee.name} during sync`,
        },
      });

      updatedOrders.push(order.id);
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedOrders.length} orders`,
      synced: updatedOrders.length,
      assignedTo: assignees.map((a) => a.name),
      noOnlineStaff: uniqueStaff.length === 0,
    });
  } catch (error) {
    console.error('Sync orders error:', error);
    return NextResponse.json({ success: false, error: 'Failed to sync orders' }, { status: 500 });
  }
}
