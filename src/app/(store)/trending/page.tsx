import React from 'react';
import type { Metadata } from 'next';
import { getTrendingProducts } from '@/lib/services/product.service';
import { TrendingCatalog } from '@/components/product/TrendingCatalog';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Trending Pieces & Best of Gents Hood | Luxury Streetwear',
  description:
    'Explore our signature lineup of oversized overcoats, heavyweight boxy tees, tailored trousers, and outerwear built for modern movement.',
};

export default async function TrendingPage() {
  const products = await getTrendingProducts(50);

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1440px] px-6 py-12 sm:px-10 lg:px-14">
      {/* Page Title */}
      <div className="pb-8 text-center sm:pb-12">
        <h1 className="heading-lg text-center text-ink">Trending Pieces</h1>
      </div>

      {/* 3. Catalog with Interactive Filters & Grid */}
      <TrendingCatalog initialProducts={products} />
    </main>
  );
}
