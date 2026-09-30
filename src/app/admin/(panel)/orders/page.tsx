import React from 'react';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrdersPageClient from './OrdersPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  // Build where clause based on role
  const whereClause = session.role !== 'OWNER' ? { assignedToId: session.id } : {};

  const [orders, counts, staffList, user] = await Promise.all([
    db.order.findMany({
      where: whereClause,
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
        assignedTo: { select: { id: true, name: true, displayColor: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    }),
    // Status counts
    (async () => {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const [statusCounts, todayCount] = await Promise.all([
        db.order.groupBy({
          by: ['status'],
          _count: { status: true },
          where: whereClause,
        }),
        db.order.count({
          where: {
            ...whereClause,
            createdAt: { gte: startOfToday },
          },
        }),
      ]);
      return {
        today: todayCount,
        byStatus: Object.fromEntries(statusCounts.map((s) => [s.status, s._count.status])),
      };
    })(),
    // Staff list (owners only, for assignment)
    session.role === 'OWNER'
      ? db.adminUser
          .findMany({
            where: { isActive: true },
            select: { id: true, name: true, displayColor: true },
            orderBy: { name: 'asc' },
          })
          .then((staff) => staff.map((s) => ({ ...s, displayColor: s.displayColor || '#6366f1' })))
      : Promise.resolve([]),
    // Current user info
    db.adminUser.findUnique({
      where: { id: session.id },
      select: { name: true, role: true, displayColor: true },
    }),
  ]);

  const sessionData = {
    id: session.id,
    name: user?.name || session.name,
    role: session.role,
  };

  return (
    <OrdersPageClient
      initialOrders={JSON.parse(JSON.stringify(orders))}
      initialCounts={counts}
      session={sessionData}
      staffList={staffList}
    />
  );
}
