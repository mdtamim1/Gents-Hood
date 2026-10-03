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

  // TASK 4: Only show orders that have been synced (syncedAt != null) OR manually created
  const syncedFilter = {
    OR: [{ syncedAt: { not: null } }, { isManualOrder: true }],
  };

  const [orders, counts, staffList, user, unsyncedCount] = await Promise.all([
    db.order.findMany({
      where: { ...whereClause, ...syncedFilter },
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
    // Status counts (only synced/manual)
    (async () => {
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

      const [statusCounts, todayCount, deliveredTodayCount] = await Promise.all([
        db.order.groupBy({
          by: ['status'],
          _count: { status: true },
          where: { ...whereClause, ...syncedFilter },
        }),
        db.order.count({
          where: {
            ...whereClause,
            ...syncedFilter,
            createdAt: { gte: startOfToday },
          },
        }),
        db.order.count({
          where: {
            ...whereClause,
            status: 'COMPLETED',
            AND: [
              syncedFilter,
              {
                OR: [{ updatedAt: { gte: startOfToday } }, { createdAt: { gte: startOfToday } }],
              },
            ],
          },
        }),
      ]);
      return {
        today: todayCount,
        deliveredToday: deliveredTodayCount,
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
    // Count customer orders waiting to be synced
    db.order.count({
      where: { syncedAt: null, isManualOrder: false },
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
      initialUnsyncedCount={unsyncedCount}
    />
  );
}
