import React from 'react';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/permissions';
import OrdersPageClient from './OrdersPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const auth = await verifyAdminAccess('orders');
  if (!auth.authorized) {
    if (auth.reason === 'forbidden' && auth.fallbackUrl) {
      redirect(auth.fallbackUrl);
    }
    redirect(`/admin/login?reason=${auth.reason}`);
  }
  const session = auth.session;
  const currentRole = (auth.user?.role || session.role) as 'OWNER' | 'STAFF';

  // By default, staff sees only their assigned orders.
  // When staff searches (via API), they can search all orders across the store.
  // Admin sees all orders.
  const whereClause = currentRole !== 'OWNER' ? { assignedToId: session.id } : {};

  const [orders, counts, staffList, user] = await Promise.all([
    db.order.findMany({
      where: whereClause,
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 },
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
        assignedTo: { select: { id: true, name: true, displayColor: true } },
        customer: { select: { id: true, name: true, phone: true } },
        appeals: { orderBy: { createdAt: 'desc' }, take: 1 },
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
    // Staff list with live online status (owners only, for assignment & filtering)
    currentRole === 'OWNER'
      ? (async () => {
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
          return allStaff.map((s) => ({
            id: s.id,
            name: s.name,
            displayColor: s.displayColor || '#6366f1',
            isOnline: onlineIds.has(s.id),
          }));
        })()
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
    role: currentRole,
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
