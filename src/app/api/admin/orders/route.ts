import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'ALL';
    const dateFilter = searchParams.get('date') || 'ALL'; // TODAY, ALL

    // TASK 4: Only show orders that have been synced (syncedAt != null) OR manually created
    // Customer web orders without syncedAt are hidden until admin clicks "Order Sync"
    const baseFilter = {
      OR: [{ syncedAt: { not: null } }, { isManualOrder: true }],
    };

    const whereClause: Record<string, unknown> = { ...baseFilter };

    // Status filter
    if (status !== 'ALL') {
      whereClause.status = status;
    }

    // Date filter - TODAY means current calendar day
    if (dateFilter === 'TODAY') {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      whereClause.createdAt = { gte: startOfDay, lt: endOfDay };
    }

    // Scoping:
    // If not OWNER and NOT searching: staff only sees their own assigned orders
    // If searching (e.g. customer phone or order ID): staff can search across ALL orders in the store!
    if (session.role !== 'OWNER' && !search) {
      whereClause.assignedToId = session.id;
    }

    // Search across entire store for orders (still only synced/manual)
    if (search) {
      // Merge OR conditions: must be synced AND match search
      whereClause.AND = [
        { OR: [{ syncedAt: { not: null } }, { isManualOrder: true }] },
        {
          OR: [
            { orderNo: { contains: search } },
            { shippingPhone: { contains: search } },
            { shippingName: { contains: search } },
            { shippingDistrict: { contains: search } },
            { shippingThana: { contains: search } },
            { shippingArea: { contains: search } },
          ],
        },
      ];
      // Remove the top-level OR so it doesn't conflict
      delete whereClause.OR;
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        assignedTo: {
          select: { id: true, name: true, email: true, displayColor: true },
        },
        customer: {
          select: { id: true, name: true, phone: true, email: true },
        },
        appeals: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Count by status for dashboard tabs (only synced/manual orders)
    const syncedFilter = { OR: [{ syncedAt: { not: null } }, { isManualOrder: true }] };
    const statusCounts = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
      where:
        session.role !== 'OWNER' ? { assignedToId: session.id, ...syncedFilter } : syncedFilter,
    });

    // Today's count (only synced/manual orders)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    const m = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10);
    const d = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
    const y = parseInt(parts.find((p) => p.type === 'year')?.value || '2026', 10);
    const startOfToday = new Date(Date.UTC(y, m - 1, d, -6, 0, 0));

    const [todayCount, deliveredTodayCount] = await Promise.all([
      db.order.count({
        where: {
          createdAt: { gte: startOfToday },
          ...(session.role !== 'OWNER' ? { assignedToId: session.id } : {}),
          ...syncedFilter,
        },
      }),
      db.order.count({
        where: {
          status: 'COMPLETED',
          AND: [
            syncedFilter,
            {
              OR: [{ updatedAt: { gte: startOfToday } }, { createdAt: { gte: startOfToday } }],
            },
          ],
          ...(session.role !== 'OWNER' ? { assignedToId: session.id } : {}),
        },
      }),
    ]);

    // Count unsynced web orders (pending in queue) for Sync button badge
    const unsyncedCount = await db.order.count({
      where: { syncedAt: null, isManualOrder: false },
    });

    // Fetch live staff online status if OWNER
    let staffList: Array<{ id: string; name: string; displayColor: string; isOnline: boolean }> =
      [];
    if (session.role === 'OWNER') {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const [allStaff, activeSessions] = await Promise.all([
        db.adminUser.findMany({
          where: { isActive: true, role: 'STAFF' },
          select: { id: true, name: true, displayColor: true },
          orderBy: { name: 'asc' },
        }),
        db.staffSession.findMany({
          where: {
            isActive: true,
            lastSeenAt: { gte: fiveMinAgo },
          },
          select: { staffId: true },
        }),
      ]);
      const onlineIds = new Set(activeSessions.map((s) => s.staffId));
      staffList = allStaff.map((s) => ({
        id: s.id,
        name: s.name,
        displayColor: s.displayColor || '#6366f1',
        isOnline: onlineIds.has(s.id),
      }));
    }

    return NextResponse.json({
      success: true,
      orders,
      counts: {
        today: todayCount,
        deliveredToday: deliveredTodayCount,
        byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])),
      },
      staffList,
      unsyncedCount,
    });
  } catch (error: unknown) {
    console.error('Failed to list orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve orders' },
      { status: 500 }
    );
  }
}

// POST: Create manual order
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Generate or use provided GH order number
    let orderNo =
      typeof body.orderNo === 'string' && body.orderNo.trim().startsWith('GH-')
        ? body.orderNo.trim()
        : '';
    if (!orderNo) {
      const count = await db.order.count();
      orderNo = `GH-${String(count + 1001).padStart(4, '0')}`;
    }
    const existingOrderNo = await db.order.findUnique({ where: { orderNo } });
    if (existingOrderNo) {
      orderNo = `GH-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const shopNote =
      [body.shopNote?.trim(), body.memo ? `[Tx: ${body.memo.trim()}]` : null]
        .filter(Boolean)
        .join(' | ') || null;

    // Find or create customer
    let customer = null;
    if (body.shippingPhone) {
      customer = await db.customer.findUnique({
        where: { phone: body.shippingPhone },
      });
      if (!customer && body.shippingName) {
        customer = await db.customer.create({
          data: {
            name: body.shippingName,
            phone: body.shippingPhone,
            email: body.email || undefined,
          },
        });
      }
    }

    const subtotal =
      body.items?.reduce(
        (sum: number, item: { priceSnapshot: number; qty: number }) =>
          sum + item.priceSnapshot * item.qty,
        0
      ) || 0;

    const deliveryCharge = body.deliveryCharge || 0;
    const discount = (body.manualDiscount || 0) + (body.discount || 0);
    const total = subtotal + deliveryCharge - discount;

    const order = await db.order.create({
      data: {
        orderNo,
        customerId: customer?.id || null,
        status: body.status || 'PROCESSING',
        paymentMethod: body.paymentMethod || 'COD',
        paymentStatus: body.paymentStatus || 'UNPAID',
        subtotal,
        deliveryCharge,
        discount,
        manualDiscount: body.manualDiscount || 0,
        paidAmount: body.paidAmount || 0,
        total,
        shippingName: body.shippingName,
        shippingPhone: body.shippingPhone,
        shippingDistrict: body.shippingDistrict || '',
        shippingThana: body.shippingThana || '',
        shippingArea: body.shippingArea || '',
        shippingAddress: body.shippingAddress || '',
        note: body.note || null,
        shopNote,
        courierName: body.courierName || null,
        isManualOrder: true,
        syncedAt: new Date(), // Manual orders are already "synced"
        assignedToId: session.id,
        items: {
          create: (body.items || []).map(
            (item: {
              productId: string;
              variantId?: string;
              nameSnapshot: string;
              sizeSnapshot?: string;
              colorSnapshot?: string;
              priceSnapshot: number;
              qty: number;
              imageSnapshot?: string;
            }) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              nameSnapshot: item.nameSnapshot,
              sizeSnapshot: item.sizeSnapshot || null,
              colorSnapshot: item.colorSnapshot || null,
              priceSnapshot: item.priceSnapshot,
              qty: item.qty,
              imageSnapshot: item.imageSnapshot || null,
            })
          ),
        },
        statusHistory: {
          create: {
            status: body.status || 'PROCESSING',
            note: 'Order created manually by admin',
            adminId: session.id,
            adminName: session.name,
          },
        },
        activityLogs: {
          create: {
            adminId: session.id,
            adminName: session.name,
            action: 'CREATED',
            newValue: orderNo,
            note: `Manual order created by ${session.name}`,
          },
        },
      },
      include: {
        items: true,
        assignedTo: { select: { id: true, name: true, displayColor: true } },
      },
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error: unknown) {
    console.error('Create order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}
