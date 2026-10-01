import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyAdminAccess, getFirstAllowedPath } from '@/lib/permissions';
import { StaffPageClient } from './StaffPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminStaffPage() {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) redirect('/admin/login');
  if (auth.user.role !== 'OWNER') {
    redirect(getFirstAllowedPath(auth.user));
  }
  const session = auth.session;

  // Get all staff
  const [staff, activeSessions] = await Promise.all([
    db.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        displayColor: true,
        permissions: true,
        lastLoginAt: true,
        lastLogoutAt: true,
        createdAt: true,
        _count: { select: { assignedOrders: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    db.staffSession.findMany({
      where: {
        isActive: true,
        lastSeenAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      },
      select: { staffId: true, lastSeenAt: true },
    }),
  ]);

  const onlineIds = new Set(activeSessions.map((s) => s.staffId));

  const staffWithStatus = staff.map((s) => ({
    ...s,
    permissions: s.permissions ? JSON.parse(s.permissions) : { orders: true },
    isOnline: onlineIds.has(s.id),
  }));

  return (
    <StaffPageClient
      initialStaff={JSON.parse(JSON.stringify(staffWithStatus))}
      currentUserId={session.id}
    />
  );
}
