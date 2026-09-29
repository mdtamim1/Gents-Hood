'use client';

import React, { useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, getSubtotal } = useCartStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    [setIsOpen]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const subtotal = getSubtotal();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="bg-ink/70 fixed inset-0 backdrop-blur-[2px] transition-opacity"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="flex w-screen max-w-md flex-col justify-between border-l border-line bg-cream shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ink">
              Shopping Bag ({items.reduce((acc, item) => acc + item.quantity, 0)})
            </h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close cart"
              className="text-ink/70 p-1.5 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 divide-y divide-line overflow-y-auto px-6 py-6">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 py-12 text-center">
                <p className="text-xs uppercase tracking-widest text-muted">Your bag is empty</p>
                <Button variant="primary" size="sm" onClick={() => setIsOpen(false)}>
                  Continue Browsing
                </Button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId || 'default'}`}
                  className="flex gap-4 py-4"
                >
                  <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden border border-line bg-cream-soft">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="line-clamp-1 text-xs font-semibold uppercase tracking-wider text-ink">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          aria-label={`Remove ${item.name}`}
                          className="ml-2 text-[11px] text-muted hover:text-danger"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-1 space-x-2 text-[10px] uppercase tracking-wider text-muted">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>• Color: {item.color}</span>}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.variantId)
                          }
                          disabled={item.quantity <= 1}
                          className="px-2.5 py-0.5 text-xs text-ink hover:bg-cream-soft disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="px-2 font-mono text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.variantId)
                          }
                          className="px-2.5 py-0.5 text-xs text-ink hover:bg-cream-soft"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout */}
          {items.length > 0 && (
            <div className="space-y-4 border-t border-line bg-cream p-6">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider">
                <span className="text-muted">Subtotal</span>
                <span className="text-sm font-bold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-[10px] tracking-wide text-muted">
                Delivery and taxes calculated at checkout. Free shipping on orders over ৳1,999.
              </p>
              <div className="space-y-2">
                <Link href="/checkout" onClick={() => setIsOpen(false)} className="block w-full">
                  <Button variant="primary" size="lg" className="w-full">
                    Proceed to Checkout
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-1 text-center text-[10px] uppercase tracking-looser text-muted hover:text-ink"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
