import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, PhoneCall } from 'lucide-react';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { OrderSuccessTracker } from '@/components/checkout/OrderSuccessTracker';

interface OrderSuccessPageProps {
  params: {
    orderNo: string;
  };
}

export const metadata: Metadata = {
  title: 'Order Confirmation | Gents Hood',
  description: 'Thank you for your order. Your menswear pieces are being prepared for dispatch.',
};

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const order = await db.order.findUnique({
    where: { orderNo: params.orderNo },
    include: {
      items: true,
      statusHistory: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!order) {
    notFound();
  }

  const totalItemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <main className="mx-auto min-h-[80vh] max-w-[880px] px-6 py-12 sm:px-10 sm:py-20">
      {/* Client Analytics Dispatch & Cart Cleanup */}
      <OrderSuccessTracker orderNo={order.orderNo} total={order.total} itemCount={totalItemCount} />

      <div className="space-y-4 text-center">
        {/* Animated Check Icon */}
        <div className="mx-auto flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-ink text-cream">
          <CheckCircle2 className="h-10 w-10 stroke-[1.75] text-cream" />
        </div>

        {/* Abhinondon Message */}
        <span className="label-caps text-muted">Order Confirmed</span>
        <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
          অভিনন্দন! / Congratulations!
        </h1>
        <p className="mx-auto max-w-md text-xs leading-relaxed text-muted sm:text-sm">
          Your order has been placed successfully. A representative will contact you shortly to
          confirm dispatch.
        </p>

        {/* Order Number Badge */}
        <div className="inline-flex items-center gap-2 border border-line bg-cream-soft px-4 py-2 pt-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink">
          <span>Order No: {order.orderNo}</span>
        </div>
      </div>

      {/* Order Summary Receipt Box */}
      <div className="mt-12 space-y-8 border border-line bg-cream-soft p-6 sm:p-10">
        <div className="flex flex-col items-start justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
              Delivery Recipient
            </h2>
            <p className="mt-1 text-xs font-medium text-ink">{order.shippingName}</p>
            <p className="text-xs text-muted">{order.shippingPhone}</p>
            <p className="mt-0.5 text-xs text-muted">
              {order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}
            </p>
          </div>

          <div className="text-xs sm:text-right">
            <h2 className="font-bold uppercase tracking-wider text-ink">Payment Method</h2>
            <p className="mt-1 font-medium text-ink">Cash on Delivery (COD)</p>
            <p className="text-muted">Status: {order.paymentStatus}</p>
          </div>
        </div>

        {/* Items List Snapshot */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
            Ordered Items ({order.items.length})
          </h2>

          <div className="divide-y divide-line">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-12 flex-shrink-0 overflow-hidden border border-line bg-cream">
                    <Image
                      src={item.imageSnapshot || '/images/gallery-front.jpg'}
                      alt={item.nameSnapshot}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                      {item.nameSnapshot}
                    </h3>
                    <p className="text-[10px] uppercase text-muted">
                      {item.sizeSnapshot && `Size: ${item.sizeSnapshot}`}{' '}
                      {item.colorSnapshot && `• ${item.colorSnapshot}`} • Qty: {item.qty}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-xs font-medium text-ink">
                  {formatPrice(item.priceSnapshot * item.qty)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Breakdown */}
        <div className="space-y-2 border-t border-line pt-4 text-xs uppercase tracking-wider text-ink">
          <div className="flex justify-between">
            <span className="text-muted">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Delivery Charge</span>
            <span>{order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3 text-sm font-bold">
            <span>Total Payable on Delivery</span>
            <span className="text-lg font-extrabold text-ink">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Dispatch Next Steps Notification */}
        <div className="space-y-2 border border-line bg-cream p-4 text-xs text-muted">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-ink">
            <PhoneCall className="h-4 w-4" />
            <span>Verification Process</span>
          </div>
          <p className="leading-relaxed">
            Our dispatch coordinator will phone your number ({order.shippingPhone}) prior to sending
            out the rider. Please keep your phone accessible.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
          <Link href={`/track-order?orderNo=${order.orderNo}`} className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full">
              Track Order
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" size="md" className="w-full">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
