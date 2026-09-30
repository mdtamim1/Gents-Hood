import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const metadata: Metadata = {
  title: 'Secure Checkout | Gents Hood',
  description:
    'Complete your order with cash on delivery and fast express shipping across Bangladesh.',
};

export default function CheckoutPage() {
  return (
    <main className="min-h-[80vh]">
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1280px] px-6 py-20 text-center text-xs uppercase tracking-widest text-muted">
            Loading Checkout...
          </div>
        }
      >
        <CheckoutForm />
      </Suspense>
    </main>
  );
}
