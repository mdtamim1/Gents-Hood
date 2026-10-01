import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';
import { ProductsTableClient } from './ProductsTableClient';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const auth = await verifyAdminAccess('products');
  if (!auth.authorized) {
    if (auth.reason === 'forbidden' && auth.fallbackUrl) {
      redirect(auth.fallbackUrl);
    }
    redirect(`/admin/login?reason=${auth.reason}`);
  }

  const [products, siteSetting] = await Promise.all([
    db.product.findMany({
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.siteSetting.findFirst({
      select: { featuredProductId: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="label-caps tracking-widest text-muted">Catalog & Inventory</span>
        <h1 className="heading-xl mt-1 tracking-tight text-cream">Products Management</h1>
        <p className="mt-1 text-xs text-muted">
          Manage prices, stock levels, variants, and select which items display in the &quot;Best of
          Gents Hood&quot; trending section.
        </p>
      </div>

      <ProductsTableClient
        initialProducts={products}
        initialSignatureProductId={siteSetting?.featuredProductId || null}
      />
    </div>
  );
}
