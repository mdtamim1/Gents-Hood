'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ProductWithRelations } from '@/types';
import { formatPrice } from '@/lib/utils/money';
import { QuickSizeModal } from '@/components/product/QuickSizeModal';

interface ProductCardProps {
  product: ProductWithRelations;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isQuickSizeOpen, setIsQuickSizeOpen] = useState(false);
  const [isQuickAnimating, setIsQuickAnimating] = useState(false);

  const handleOpenQuickSize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickAnimating(true);
    setTimeout(() => {
      setIsQuickAnimating(false);
      setIsQuickSizeOpen(true);
    }, 220);
  };

  const primaryImage = product.images[0]?.url || '/images/gallery-front.jpg';
  const secondaryImage = product.images[1]?.url || primaryImage;
  const hasMultipleImages = product.images.length > 1;

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col">
      {/* 3:4 Image Container */}
      <div className="relative aspect-[3/4] w-full select-none overflow-hidden border border-line bg-cream-soft">
        <Link
          href={`/product/${product.slug}`}
          aria-label={`View details for ${product.name}`}
          className="absolute inset-0 block"
        >
          {/* Primary Image - CSS group-hover handles fade/scale without JS re-renders */}
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
            className={`object-cover object-center transition-all duration-500 ease-out ${
              hasMultipleImages ? 'group-hover:scale-105 group-hover:opacity-0' : ''
            }`}
          />

          {/* Secondary Image on Hover - CSS group-hover reveals it */}
          {hasMultipleImages && (
            <Image
              src={secondaryImage}
              alt={`${product.name} alternate view`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
              className="absolute inset-0 object-cover object-center opacity-0 transition-all duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute left-3 top-3 z-10 bg-[#4A0E17] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-cream">
            -{discount}%
          </div>
        )}

        {/* Quick Add Bar - always visible on mobile, CSS group-hover slides up on desktop */}
        <div className="absolute inset-x-0 bottom-0 z-10 translate-y-0 transition-transform duration-300 ease-out sm:translate-y-full sm:group-hover:translate-y-0">
          <button
            type="button"
            onClick={handleOpenQuickSize}
            className={`group/btn relative flex w-full items-center justify-center gap-1.5 overflow-hidden py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 sm:py-3 sm:text-[11px] sm:tracking-looser ${
              isQuickAnimating
                ? 'animate-gaming-glow -translate-y-0.5 border-t border-[#4A0E17] bg-[#4A0E17] text-cream shadow-[0_0_24px_rgba(74,14,23,0.9)]'
                : 'hover:animate-gaming-glow bg-[#4A0E17] text-cream shadow-[0_2px_10px_rgba(74,14,23,0.3)] hover:bg-[#380b12] hover:shadow-[0_0_20px_rgba(74,14,23,0.7)]'
            }`}
          >
            {isQuickAnimating ? (
              <span className="animate-cyber-beam pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            ) : (
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <span>+ Quick Add</span>
            </span>
          </button>
        </div>
      </div>

      {/* Product Information (Center Aligned) */}
      <div className="mt-3 flex flex-col items-center space-y-1 text-center">
        <Link href={`/product/${product.slug}`} className="w-full focus-visible:outline-none">
          <h4 className="line-clamp-1 text-center text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:text-[#4A0E17] sm:text-sm">
            {product.name}
          </h4>
        </Link>

        <div className="flex items-baseline justify-center gap-2">
          <span className="text-xs font-bold text-ink sm:text-sm">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && (
            <span className="font-mono text-[11px] text-muted line-through sm:text-xs">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>
      </div>

      {/* Floating Quick Size Selection Modal */}
      <QuickSizeModal
        product={product}
        isOpen={isQuickSizeOpen}
        onClose={() => setIsQuickSizeOpen(false)}
      />
    </div>
  );
}
