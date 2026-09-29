'use client';

import React, { useState, useMemo } from 'react';
import { ProductWithRelations } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';

interface TrendingCatalogProps {
  initialProducts: ProductWithRelations[];
}

export function TrendingCatalog({ initialProducts }: TrendingCatalogProps) {
  const [selectedSize, setSelectedSize] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>(
    'featured'
  );

  const sizes = ['ALL', 'S', 'M', 'L', 'XL', 'XXL'];

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by size
    if (selectedSize !== 'ALL') {
      result = result.filter((p) =>
        p.variants.some((v) => v.size.toUpperCase() === selectedSize && v.stock > 0)
      );
    }

    // Sort products
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      // featured / trendingOrder
      result.sort((a, b) => a.trendingOrder - b.trendingOrder);
    }

    return result;
  }, [initialProducts, selectedSize, sortBy]);

  return (
    <div className="space-y-8">
      {/* Controls Bar: Size Chips & Sort Dropdown */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
        {/* Size Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Size:
          </span>
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(size)}
              className={`rounded-[1px] border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                selectedSize === size
                  ? 'border-ink bg-ink text-cream'
                  : 'border-line bg-cream text-ink hover:border-ink'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Sort & Count */}
        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
          <span className="text-[11px] uppercase tracking-wider text-muted">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Piece' : 'Pieces'}
          </span>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc' | 'newest')
              }
              aria-label="Sort products by"
              className="cursor-pointer appearance-none rounded-[1px] border border-line bg-cream px-3.5 py-1.5 pr-8 text-xs font-medium uppercase tracking-wider text-ink focus:border-ink focus:outline-none"
            >
              <option value="featured">Curated Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-ink">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className="space-y-4 py-20 text-center">
          <p className="text-xs uppercase tracking-widest text-muted">
            No products match the selected size filter.
          </p>
          <button
            type="button"
            onClick={() => setSelectedSize('ALL')}
            className="text-xs font-semibold uppercase tracking-looser text-ink underline underline-offset-4"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 md:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
