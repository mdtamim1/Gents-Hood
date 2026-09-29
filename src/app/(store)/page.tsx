import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { GalleryStrip } from '@/components/landing/GalleryStrip';
import { FeaturedProduct } from '@/components/landing/FeaturedProduct';
import { TrustBar } from '@/components/landing/TrustBar';

export default function HomePage() {
  return (
    <>
      {/* 1. Hero Section (with giant typography & cutout model overlap) */}
      <Hero />

      {/* 2. Main Product Gallery Strip (full-width ink band with 3 perspective cards) */}
      <GalleryStrip />

      {/* 3. NEW VIBES Main Product Section (interactive swatches, size picker, zoom gallery) */}
      <FeaturedProduct />

      {/* 4. Trust Bar (4 key service guarantees with line icons) */}
      <TrustBar />
    </>
  );
}
