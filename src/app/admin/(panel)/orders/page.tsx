import React from 'react';
import { db } from '@/lib/db';
import { OrdersListClient } from './OrdersListClient';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="label-caps tracking-widest text-muted">Fulfillment & Operations</span>
        <h1 className="heading-xl mt-1 tracking-tight text-cream">Orders Management</h1>
        <p className="mt-1 text-xs text-muted">
          Track incoming customer orders, confirm dispatch, update delivery timelines, and export
          sales data.
        </p>
      </div>

      <OrdersListClient initialOrders={orders} />
    </div>
  );
}
