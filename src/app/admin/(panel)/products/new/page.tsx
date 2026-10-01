import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/permissions';
import { ProductForm } from '../ProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const auth = await verifyAdminAccess('products');
  if (!auth.authorized) {
    if (auth.reason === 'forbidden' && auth.fallbackUrl) {
      redirect(auth.fallbackUrl);
    }
    redirect(`/admin/login?reason=${auth.reason}`);
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<div className="p-8 text-xs text-white/50">Loading product editor...</div>}>
        <ProductForm />
      </Suspense>
    </div>
  );
}

