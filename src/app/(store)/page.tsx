import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { GalleryStrip } from '@/components/landing/GalleryStrip';
import { FeaturedProduct } from '@/components/landing/FeaturedProduct';
import { ProductQualityFAQ } from '@/components/landing/ProductQualityFAQ';
import { StyleManifestoMarquee } from '@/components/landing/StyleManifestoMarquee';
import { TrendingGrid } from '@/components/landing/TrendingGrid';
import { getFeaturedProduct, getTrendingProducts } from '@/lib/services/product.service';
import { getSiteSettings } from '@/lib/services/settings.service';

// Incremental Static Regeneration (ISR) every 30 seconds
export const revalidate = 30;

export default async function HomePage() {
  // Fetch real database records in parallel via cached backend services
  const [featuredProduct, siteSettings, trendingProducts] = await Promise.all([
    getFeaturedProduct(),
    getSiteSettings(),
    getTrendingProducts(8),
  ]);

  const siteUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://gentshood.com'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://gentshood.com').replace(/\/+$/, '');

  let parsedSocial: Record<string, string> = {};
  if (siteSettings?.socialLinks) {
    try {
      parsedSocial = JSON.parse(siteSettings.socialLinks);
    } catch {
      parsedSocial = {};
    }
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Gents Hood',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/trending?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gents Hood',
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    sameAs: [
      parsedSocial.facebook,
      parsedSocial.instagram,
      parsedSocial.tiktok,
      parsedSocial.youtube,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: siteSettings?.contactPhone || '+880 1700-000000',
      contactType: 'Customer Support',
      areaServed: 'BD',
      availableLanguage: ['English', 'Bengali'],
    },
  };

  const typedSettings = siteSettings as typeof siteSettings & {
    galleryStripJson?: string | null;
    trendingBannerJson?: string | null;
  };
  let adminGalleryItems: { id: string; title: string; image: string; alt?: string }[] | undefined =
    undefined;
  if (typedSettings?.galleryStripJson) {
    try {
      const parsed = JSON.parse(typedSettings.galleryStripJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        adminGalleryItems = parsed.map(
          (item: { id?: string; title?: string; image?: string }, idx: number) => ({
            id: item.id || String(idx + 1),
            title: item.title || `Preview ${idx + 1}`,
            image: item.image || '/images/gallery-front.jpg',
            alt: item.title,
          })
        );
      }
    } catch {
      // Fallback
    }
  }

  const galleryItems =
    adminGalleryItems ||
    (featuredProduct?.images && featuredProduct.images.length >= 3
      ? featuredProduct.images.slice(0, 3).map((img, idx) => ({
          id: img.id,
          title: idx === 0 ? 'Front View' : idx === 1 ? 'Texture & Detail' : 'Silhouette Fit',
          image: img.url,
          alt: img.alt || featuredProduct.name,
        }))
      : undefined);

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* 1. Hero Section (with giant typography & cutout model overlap) — above fold, renders eagerly */}
      <Hero tagline={siteSettings?.heroTagline} backgroundWord={siteSettings?.heroBackgroundWord} />

      {/* 2. Main Product Gallery Strip — just below hero, renders eagerly */}
      <GalleryStrip items={galleryItems} />

      {/* 3. NEW VIBES Main Product Section (real DB data: pricing, variants, stock) */}
      <FeaturedProduct initialProduct={featuredProduct} />

      {/* 4–6: Below-fold sections — content-visibility: auto skips rendering until scroll approaches */}
      {/* 4. BEST OF GENTS HOOD (Curated Collection Banner with link to /trending) */}
      <div className="cv-auto">
        <TrendingGrid
          products={trendingProducts}
          bannerSettings={typedSettings?.trendingBannerJson}
          marqueeText={siteSettings?.trendingMarqueeText}
        />
      </div>

      {/* 5. Product Quality & Assurance FAQ (Below Best of Gents Hood) */}
      <div className="cv-auto">
        <ProductQualityFAQ faqsJson={siteSettings?.faqJson} />
      </div>

      {/* 6. Style Manifesto Dual Direction Marquee (Directly below FAQ) */}
      <div className="cv-auto-sm">
        <StyleManifestoMarquee
          line1={siteSettings?.manifestoLine1}
          line2={siteSettings?.manifestoLine2}
        />
      </div>
    </>
  );
}
