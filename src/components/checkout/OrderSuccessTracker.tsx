'use client';

import { useEffect, useRef } from 'react';
import { trackPurchase } from '@/lib/analytics';
import { useCartStore } from '@/store/cart';

interface OrderSuccessTrackerProps {
  orderNo: string;
  total: number;
  itemCount: number;
}

export function OrderSuccessTracker({ orderNo, total, itemCount }: OrderSuccessTrackerProps) {
  const clearCart = useCartStore((state) => state.clearCart);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;

    // Clear cart on successful order confirmation
    clearCart();

    // Fire Purchase event to Meta Pixel and GA4
    trackPurchase({
      order_id: orderNo,
      value: total,
      num_items: itemCount,
      currency: 'BDT',
    });
  }, [orderNo, total, itemCount, clearCart]);

  return null;
}
