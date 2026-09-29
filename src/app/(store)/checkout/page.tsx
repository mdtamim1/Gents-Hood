'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';

export default function CheckoutPlaceholderPage() {
  const { items, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  return (
    <main className="mx-auto max-w-[960px] px-6 py-16 sm:px-10 lg:px-14">
      <div className="space-y-6 border border-line bg-cream-soft p-8 text-center sm:p-12">
        <span className="label-caps text-muted">Checkout Sandbox</span>
        <h1 className="heading-md text-ink">Checkout Gateway</h1>
        <p className="mx-auto max-w-md text-xs text-muted">
          Full address form, Bangladeshi district selector, and automated Cash on Delivery order
          processing will be fully integrated in Phase 5.
        </p>

        {items.length > 0 ? (
          <div className="mx-auto max-w-md divide-y divide-line border border-line bg-cream p-4 text-left text-xs">
            <div className="flex justify-between pb-3 font-semibold uppercase tracking-wider">
              <span>Selected Items ({items.length})</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || ''}`}
                className="flex justify-between py-2"
              >
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-[10px] uppercase text-muted">
                    Size: {item.size || 'N/A'} • Color: {item.color || 'N/A'} • Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-mono">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted">No items in your bag currently.</p>
        )}

        <div className="flex justify-center gap-4 pt-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              ← Return To Store
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
