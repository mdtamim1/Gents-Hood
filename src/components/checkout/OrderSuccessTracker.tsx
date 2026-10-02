'use client';

import { useEffect, useRef } from 'react';
import { trackPurchase } from '@/lib/analytics';
import { useCartStore } from '@/store/cart';

interface OrderSuccessTrackerProps {
  orderNo: string;
  total: number;
  itemCount: number;
  contentIds?: string[];
  contents?: Array<{ id: string; quantity: number; item_price?: number }>;
}

export function OrderSuccessTracker({
  orderNo,
  total,
  itemCount,
  contentIds,
  contents,
}: OrderSuccessTrackerProps) {
  const clearCart = useCartStore((state) => state.clearCart);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    // Clear cart on successful order confirmation
    clearCart();

    // Fire Purchase event to Meta Pixel, GTM dataLayer, and GA4
    trackPurchase({
      order_id: orderNo,
      value: total,
      num_items: itemCount,
      currency: 'BDT',
      content_ids: contentIds,
      contents,
    });
  }, [orderNo, total, itemCount, contentIds, contents, clearCart]);

  return null;
}
