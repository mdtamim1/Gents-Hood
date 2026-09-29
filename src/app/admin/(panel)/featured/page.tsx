import React from 'react';
import { db } from '@/lib/db';
import { FeaturedSelectorClient } from './FeaturedSelectorClient';

export const dynamic = 'force-dynamic';

export default async function AdminFeaturedPage() {
  const [products, siteSetting] = await Promise.all([
    db.product.findMany({
      where: { status: 'ACTIVE' },
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
      <div className="border-muted/20 border-b pb-4">
        <span className="label-caps tracking-widest text-muted">Landing Experience</span>
        <h1 className="heading-xl mt-1 tracking-tight text-cream">Main Dress Selector</h1>
        <p className="mt-1 text-xs text-muted">
          Designate the flagship menswear product that appears in the Hero showcase, editorial
          layer, and NEW VIBES purchase section.
        </p>
      </div>

      <FeaturedSelectorClient
        initialProducts={products}
        currentFeaturedId={siteSetting?.featuredProductId || null}
      />
    </div>
  );
}
