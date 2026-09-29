import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { OrderDetailClient } from './OrderDetailClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <OrderDetailClient initialOrder={order} />
    </div>
  );
}
