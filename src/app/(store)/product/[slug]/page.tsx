import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getProductBySlug, getTrendingProducts } from '@/lib/services/product.service';
import { ProductDetails } from '@/components/product/ProductDetails';
import { ProductCard } from '@/components/product/ProductCard';

export const revalidate = 60;

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
      title: 'Product Not Found | Gents Hood',
    };
  }

  const primaryImage = product.images[0]?.url || '/images/gallery-front.jpg';

  return {
    title: `${product.name} | Gents Hood Menswear`,
    description:
      product.shortDescription ||
      product.description ||
      'Premium menswear engineered for modern style.',
    openGraph: {
      title: `${product.name} — Gents Hood`,
      description:
        product.shortDescription || 'Discover premium menswear crafted for effortless movement.',
      images: [
        {
          url: primaryImage,
          width: 1200,
          height: 1600,
          alt: product.name,
        },
      ],
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

  // Filter out the current product from recommendations if present
  const related = recommendations.filter((p) => p.id !== product.id).slice(0, 4);

  // Schema.org Product JSON-LD for Search Engine Optimization
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map((img) => img.url),
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
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
