'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, getSubtotal } = useCartStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isFirstRender = React.useRef(true);

  // Clean transition driven purely by isOpen
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isOpen) setIsMounted(true);
      return;
    }

    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
      }, 380);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    if (isMounted) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMounted, handleKeyDown]);

  if (!isMounted) return null;

  const subtotal = getSubtotal();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop with smooth fade in/out */}
      <div
        className={`bg-ink/75 duration-380 fixed inset-0 backdrop-blur-[3px] transition-opacity ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* 3D Perspective Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 [perspective:1200px] sm:pl-10">
        <aside
          className={`flex w-screen max-w-md flex-col justify-between border-l border-line bg-cream shadow-[-20px_0_50px_rgba(0,0,0,0.35)] ${
            isClosing ? 'animate-cart-3d-close' : 'animate-cart-3d-open'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-ink">
              Shopping Bag ({items.reduce((acc, item) => acc + item.quantity, 0)})
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close cart"
              className="text-ink/70 p-1.5 transition-transform hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink active:scale-90"
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
                <Button variant="primary" size="sm" onClick={handleClose}>
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
                      <div className="flex justify-between text-xs font-semibold text-ink">
                        <h3 className="line-clamp-1 tracking-wide">{item.name}</h3>
                        <p className="ml-4 font-mono font-bold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">
                        {item.color} / {item.size}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      {/* Quantity Controller */}
                      <div className="flex items-center border border-line bg-cream-soft">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.variantId)
                          }
                          className="hover:bg-line/20 px-2.5 py-1 text-ink"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono text-[11px] font-bold text-ink">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.variantId)
                          }
                          className="hover:bg-line/20 px-2.5 py-1 text-ink"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-[10px] uppercase tracking-wider text-muted underline hover:text-ink"
                      >
                        Remove
                      </button>
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
                Delivery charges are calculated at checkout based on your delivery area.
              </p>
              <div className="space-y-2">
                <Link href="/checkout" onClick={handleClose} className="block w-full">
                  <Button variant="primary" size="lg" className="w-full">
                    Proceed to Checkout
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={handleClose}
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
