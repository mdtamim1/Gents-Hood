import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { GalleryStrip } from '@/components/landing/GalleryStrip';
import { FeaturedProduct } from '@/components/landing/FeaturedProduct';
import { TrustBar } from '@/components/landing/TrustBar';
import { TrendingGrid } from '@/components/landing/TrendingGrid';
import { getFeaturedProduct, getTrendingProducts } from '@/lib/services/product.service';
import { getSiteSettings } from '@/lib/services/settings.service';

// Incremental Static Regeneration (ISR) every 60 seconds
export const revalidate = 60;

export default async function HomePage() {
  // Fetch real database records in parallel via cached backend services
  const [featuredProduct, siteSettings, trendingProducts] = await Promise.all([
    getFeaturedProduct(),
    getSiteSettings(),
    getTrendingProducts(8),
  ]);

  return (
    <>
      {/* 1. Hero Section (with giant typography & cutout model overlap) */}
      <Hero />

      {/* 2. Main Product Gallery Strip (full-width ink band with 3 perspective cards) */}
      <GalleryStrip />

      {/* 3. NEW VIBES Main Product Section (real DB data: pricing, variants, stock) */}
      <FeaturedProduct
        initialProduct={featuredProduct}
        freeDeliveryMin={siteSettings?.freeDeliveryMin || 1999}
      />

      {/* 4. Trust Bar (4 key service guarantees with line icons) */}
      <TrustBar />

      {/* 5. BEST OF GENTS HOOD (Top 8 Trending grid with wishlist & quick add) */}
      <TrendingGrid products={trendingProducts} />
    </>
  );
}
