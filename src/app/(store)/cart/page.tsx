'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  const isFreeDelivery = subtotal >= 1999;
  const estimatedDelivery = isFreeDelivery ? 0 : 70;
  const total = subtotal + estimatedDelivery;

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1440px] px-6 py-12 sm:px-10 lg:px-14">
      <div className="space-y-1 border-b border-line pb-8">
        <span className="label-caps text-muted">Shopping Bag</span>
        <h1 className="heading-lg text-ink">Your Selected Pieces</h1>
      </div>

      {items.length === 0 ? (
        <div className="space-y-6 py-24 text-center">
          <p className="text-sm uppercase tracking-widest text-muted">
            Your shopping bag is currently empty.
          </p>
          <Link href="/trending">
            <Button variant="primary" size="md">
              Explore Collection
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: Cart Items Table */}
          <div className="divide-y divide-line lg:col-span-8">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'default'}`}
                className="flex flex-col items-start justify-between gap-6 py-6 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-5">
                  <div className="relative h-28 w-24 flex-shrink-0 overflow-hidden border border-line bg-cream-soft">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-ink">
                      {item.name}
                    </h3>
                    <div className="space-x-3 text-xs uppercase tracking-wider text-muted">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && <span>• Color: {item.color}</span>}
                    </div>
                    <p className="pt-1 font-mono text-xs font-medium text-ink">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>

                <div className="flex w-full items-center justify-between sm:w-auto sm:gap-8">
                  {/* Quantity Control */}
                  <div className="flex items-center border border-line bg-cream">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1, item.variantId)
                      }
                      disabled={item.quantity <= 1}
                      className="px-3 py-1 text-sm text-ink hover:bg-cream-soft disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="px-3 font-mono text-xs font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1, item.variantId)
                      }
                      className="px-3 py-1 text-sm text-ink hover:bg-cream-soft"
                    >
                      +
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="min-w-[80px] text-right">
                    <span className="text-sm font-bold text-ink">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.variantId)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1 text-xs text-muted hover:text-danger"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-6 border border-line bg-cream-soft p-6 sm:p-8 lg:sticky lg:top-24 lg:col-span-4">
            <h2 className="border-b border-line pb-4 text-sm font-bold uppercase tracking-wider text-ink">
              Summary
            </h2>

            <div className="space-y-3 text-xs uppercase tracking-wider text-ink">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Estimated Shipping</span>
                <span className="font-semibold">
                  {isFreeDelivery ? 'FREE' : formatPrice(estimatedDelivery)}
                </span>
              </div>
              {isFreeDelivery ? (
                <p className="text-[10px] tracking-wide text-success">
                  ✓ Free delivery threshold unlocked!
                </p>
              ) : (
                <p className="text-[10px] tracking-wide text-muted">
                  Add {formatPrice(1999 - subtotal)} more to qualify for Free Shipping.
                </p>
              )}
            </div>

            <div className="flex items-baseline justify-between border-t border-line pt-4 text-sm font-bold uppercase tracking-wider">
              <span>Estimated Total</span>
              <span className="text-lg">{formatPrice(total)}</span>
            </div>

            <div className="space-y-3 pt-2">
              <Link href="/checkout" className="block w-full">
                <Button variant="primary" size="lg" className="w-full">
                  Proceed to Checkout
                </Button>
              </Link>
              <Link
                href="/trending"
                className="block text-center text-[11px] uppercase tracking-looser text-muted hover:text-ink"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
