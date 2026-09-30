import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSiteSettings } from '@/lib/services/settings.service';
import { OrderSuccessTracker } from '@/components/checkout/OrderSuccessTracker';
import { OrderSuccessClient } from '@/components/checkout/OrderSuccessClient';

interface OrderSuccessPageProps {
  params: {
    orderNo: string;
  };
}

export const metadata: Metadata = {
  title: 'Order Confirmation — GENTS HOOD Atelier',
  description: 'Thank you for your order. Your menswear pieces are being prepared for dispatch.',
};

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { orderNo: params.orderNo },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    }),
    getSiteSettings(),
  ]);

  if (!order) {
    notFound();
  }

  const totalItemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <main className="min-h-screen">
      {/* Client Analytics Dispatch & Cart Cleanup */}
      <OrderSuccessTracker orderNo={order.orderNo} total={order.total} itemCount={totalItemCount} />

      {/* Ultra-Premium Interactive Animated Order Confirmation View */}
      <OrderSuccessClient order={order} siteSettings={settings} />
    </main>
  );
}
