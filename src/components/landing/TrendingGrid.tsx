import React from 'react';
import Link from 'next/link';
import { ProductWithRelations } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

interface TrendingGridProps {
  products: ProductWithRelations[];
}

export function TrendingGrid({ products }: TrendingGridProps) {
  if (!products || products.length === 0) return null;

  return (
    <section
      aria-label="Trending Products"
      className="w-full border-b border-line bg-cream py-16 sm:py-24"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* Section Header: BEST OF GENTS HOOD and VIEW ALL link */}
        <div className="flex items-end justify-between border-b border-line pb-8 sm:pb-12">
          <div>
            <span className="label-caps text-muted">Curated Selection</span>
            <h2 className="mt-1 text-xl font-extrabold uppercase tracking-tight text-ink sm:text-2xl lg:text-3xl">
              BEST OF GENTS HOOD
            </h2>
          </div>

          <Link
            href="/trending"
            className="group flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink underline decoration-1 underline-offset-4 transition-colors hover:text-muted"
          >
            <span>View All</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        {/* 4-column Grid on Desktop / 2-column Grid on Mobile */}
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:mt-12 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
