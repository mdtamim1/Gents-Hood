import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'ALL';
    const dateFilter = searchParams.get('date') || 'ALL'; // TODAY, ALL

    const whereClause: Record<string, unknown> = {};

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

    // Staff can only see their own assigned orders (unless OWNER)
    if (session.role !== 'OWNER') {
      whereClause.assignedToId = session.id;
    }

    // Search
    if (search) {
      whereClause.OR = [
        { orderNo: { contains: search } },
        { shippingPhone: { contains: search } },
        { shippingName: { contains: search, mode: 'insensitive' } },
        { shippingDistrict: { contains: search } },
      ];
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
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Count by status for dashboard tabs
    const statusCounts = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
      where: session.role !== 'OWNER' ? { assignedToId: session.id } : undefined,
    });

    // Today's count
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayCount = await db.order.count({
      where: {
        createdAt: { gte: startOfToday },
        ...(session.role !== 'OWNER' ? { assignedToId: session.id } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      orders,
      counts: {
        today: todayCount,
        byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])),
      },
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
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Generate order number
    const count = await db.order.count();
    const orderNo = `GH-${String(count + 1001).padStart(5, '0')}`;

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
        couponCode: body.couponCode || null,
        total,
        shippingName: body.shippingName,
        shippingPhone: body.shippingPhone,
        shippingDistrict: body.shippingDistrict || '',
        shippingThana: body.shippingThana || '',
        shippingArea: body.shippingArea || '',
        shippingAddress: body.shippingAddress || '',
        note: body.note || null,
        shopNote: body.shopNote || null,
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
