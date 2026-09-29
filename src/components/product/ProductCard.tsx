'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductWithRelations } from '@/types';
import { formatPrice } from '@/lib/utils/money';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/Toast';
import { trackAddToCart } from '@/lib/analytics';

interface ProductCardProps {
  product: ProductWithRelations;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gents_hood_wishlist');
      if (stored) {
        const list: string[] = JSON.parse(stored);
        setIsWishlisted(list.includes(product.id));
      }
    } catch {
      // Ignore storage errors
    }
  }, [product.id]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const stored = localStorage.getItem('gents_hood_wishlist');
      const list: string[] = stored ? JSON.parse(stored) : [];
      let updated: string[];

      if (list.includes(product.id)) {
        updated = list.filter((id) => id !== product.id);
        setIsWishlisted(false);
        showToast('Removed from wishlist', 'info');
      } else {
        updated = [...list, product.id];
        setIsWishlisted(true);
        showToast('Saved to wishlist', 'success');
      }
      localStorage.setItem('gents_hood_wishlist', JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const primaryVariant = product.variants[0];
    const image = product.images[0]?.url || '/images/gallery-front.jpg';

    addItem({
      productId: product.id,
      variantId: primaryVariant?.id,
      name: product.name,
      price: product.price,
      image,
      size: primaryVariant?.size || 'M',
      color: primaryVariant?.color || 'Charcoal Black',
      quantity: 1,
    });

    trackAddToCart({
      content_name: product.name,
      content_ids: [product.id],
      value: product.price,
    });

    showToast(`Added ${product.name} to bag`, 'success');
  };

  const primaryImage = product.images[0]?.url || '/images/gallery-front.jpg';
  const secondaryImage = product.images[1]?.url || primaryImage;
  const hasMultipleImages = product.images.length > 1;

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3:4 Image Container */}
      <Link
        href={`/product/${product.slug}`}
        aria-label={`View details for ${product.name}`}
        className="relative block aspect-[3/4] w-full select-none overflow-hidden border border-line bg-cream-soft"
      >
        {/* Primary Image */}
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
          className={`object-cover object-center transition-all duration-500 ease-out ${
            hasMultipleImages && isHovered ? 'scale-105 opacity-0' : 'scale-100 opacity-100'
          }`}
        />

        {/* Secondary Image on Hover */}
        {hasMultipleImages && (
          <Image
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 320px"
            className={`absolute inset-0 object-cover object-center transition-all duration-500 ease-out ${
              isHovered ? 'scale-105 opacity-100' : 'scale-100 opacity-0'
            }`}
          />
        )}

        {/* Wishlist Heart Icon (Top Right) */}
        <button
          type="button"
          onClick={toggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="bg-cream/90 absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-ink shadow-sm backdrop-blur-[2px] transition-transform hover:scale-110 active:scale-90"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? 'fill-danger text-danger' : 'stroke-[1.5] text-ink'
            }`}
          />
        </button>

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute left-3 top-3 z-10 bg-ink px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-cream">
            -{discount}%
          </div>
        )}

        {/* Quick Add Slide-up Bar on Desktop Hover */}
        <div
          className={`absolute inset-x-0 bottom-0 z-10 hidden transition-transform duration-300 ease-out sm:block ${
            isHovered ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <button
            type="button"
            onClick={handleQuickAdd}
            className="bg-ink/95 flex w-full items-center justify-center gap-1.5 py-3 text-[11px] font-medium uppercase tracking-looser text-cream backdrop-blur-[2px] transition-colors hover:bg-ink"
          >
            <span>+ Quick Add</span>
            {product.variants[0]?.size && (
              <span className="text-[10px] text-muted-inv">({product.variants[0].size})</span>
            )}
          </button>
        </div>
      </Link>

      {/* Product Information */}
      <div className="mt-3 flex flex-col space-y-1">
        <Link href={`/product/${product.slug}`} className="focus-visible:outline-none">
          <h4 className="line-clamp-1 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:text-muted sm:text-sm">
            {product.name}
          </h4>
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-ink sm:text-sm">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && (
            <span className="font-mono text-[11px] text-muted line-through sm:text-xs">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>

        {/* Mobile Quick Add Button */}
        <div className="pt-1 sm:hidden">
          <button
            type="button"
            onClick={handleQuickAdd}
            className="w-full border border-line py-1.5 text-[10px] font-medium uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream"
          >
            + Quick Add
          </button>
        </div>
      </div>
    </div>
  );
}
