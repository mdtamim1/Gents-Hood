import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';
import { AppealsPageClient } from './AppealsPageClient';

export const dynamic = 'force-dynamic';

export default async function AdminAppealsPage() {
  const auth = await verifyAdminAccess('orders');
  if (!auth.authorized) {
    if (auth.reason === 'forbidden' && auth.fallbackUrl) {
      redirect(auth.fallbackUrl);
    }
    redirect(`/admin/login?reason=${auth.reason}`);
  }

  const session = auth.session;
  const user = auth.user;
  const isOwner = user.role === 'OWNER';

  // Staff can ONLY see appeals submitted by themselves. Admin (Owner) sees all appeals.
  const baseWhere = isOwner ? {} : { staffId: session.id };

  const [appeals, pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
    db.orderAppeal.findMany({
      where: baseWhere,
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
    db.orderAppeal.count({ where: { ...baseWhere, status: 'PENDING' } }),
    db.orderAppeal.count({ where: { ...baseWhere, status: 'APPROVED' } }),
    db.orderAppeal.count({ where: { ...baseWhere, status: 'REJECTED' } }),
    db.orderAppeal.count({ where: baseWhere }),
  ]);

  return (
    <AppealsPageClient
      initialAppeals={JSON.parse(JSON.stringify(appeals))}
      initialCounts={{
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        all: totalCount,
      }}
      isOwner={isOwner}
      currentUserId={session.id}
    />
  );
}
