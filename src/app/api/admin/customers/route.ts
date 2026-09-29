import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const customers = await db.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { phone: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      include: {
        orders: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || '—',
      createdAt: c.createdAt,
      orderCount: c.orders.length,
      totalSpend: c.orders.reduce((sum, o) => sum + o.total, 0),
      lastOrderDate: c.orders[0]?.createdAt || null,
    }));

    return NextResponse.json({ success: true, customers: formatted });
  } catch (error: unknown) {
    console.error('Failed to list customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve customers' },
      { status: 500 }
    );
  }
}
