import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getProductBySlug, getTrendingProducts } from '@/lib/services/product.service';
import { ProductDetails } from '@/components/product/ProductDetails';
import { ProductCard } from '@/components/product/ProductCard';

export const revalidate = 30;

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const products = await db.product.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
  });

  return products.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  const siteUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://gentshood.com'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://gentshood.com').replace(/\/+$/, '');

  const toAbsoluteUrl = (url: string) => {
    if (!url) return `${siteUrl}/images/logo.png`;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const primaryImage = product.images[0]?.url || '/images/gallery-front.jpg';
  const absolutePrimaryImage = toAbsoluteUrl(primaryImage);

  const ogImages =
    product.images.length > 0
      ? product.images.map((img) => ({
          url: toAbsoluteUrl(img.url),
          width: 1200,
          height: 1200,
          alt: `${product.name} — Gents Hood`,
        }))
      : [
          {
            url: absolutePrimaryImage,
            width: 1200,
            height: 1200,
            alt: product.name,
          },
        ];

  const canonicalUrl = `${siteUrl}/product/${product.slug}`;
  const description =
    product.shortDescription ||
    product.description ||
    `Order ${product.name} at Gents Hood. Premium fabrics, tailored fit, nationwide delivery in Bangladesh.`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${product.name} — Gents Hood`,
      description,
      url: canonicalUrl,
      siteName: 'Gents Hood',
      locale: 'en_US',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Gents Hood`,
      description,
      images: [absolutePrimaryImage],
    },
    other: {
      'product:price:amount': String(product.price),
      'product:price:currency': 'BDT',
      'product:availability': product.status === 'ACTIVE' ? 'in stock' : 'out of stock',
      'product:brand': 'Gents Hood',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const [product, recommendations] = await Promise.all([
    getProductBySlug(params.slug),
    getTrendingProducts(4),
  ]);

  if (!product) {
    notFound();
  }

  const siteUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://gentshood.com'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://gentshood.com').replace(/\/+$/, '');

  const toAbsoluteUrl = (url: string) => {
    if (!url) return `${siteUrl}/images/logo.png`;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Filter out the current product from recommendations if present
  const related = recommendations.filter((p) => p.id !== product.id).slice(0, 4);

  // Schema.org Product JSON-LD for Google Search Rich Results
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((img) => toAbsoluteUrl(img.url)),
    description: product.shortDescription || product.description,
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Gents Hood',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability:
        product.status === 'ACTIVE'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: `${siteUrl}/product/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'Gents Hood',
      },
    },
  };

  // Schema.org BreadcrumbList for Google Search Results
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Trending',
        item: `${siteUrl}/trending`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `${siteUrl}/product/${product.slug}`,
      },
    ],
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main className="py-10 sm:py-16">
        {/* Main Product Layout */}
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
          <ProductDetails product={product} />
        </div>

        {/* You May Also Like Recommendations */}
        {related.length > 0 && (
          <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
            <section aria-label="Related Recommendations" className="pt-16 sm:pt-20">
              <div className="space-y-1 pb-8">
                <span className="label-caps text-muted">Complete The Silhouette</span>
                <h3 className="text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl">
                  You May Also Like
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4">
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
