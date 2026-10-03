import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { getOrSetCache } from '@/lib/cache';
import { ProductWithRelations } from '@/types';

/**
 * Fetch the current Featured / Main product configured in SiteSettings.
 * Uses both Redis cache (L2) and Next.js Data Cache (tagged) for instant
 * revalidation when admin calls revalidateTag('featured_product').
 */
export const getFeaturedProduct = unstable_cache(
  async (): Promise<ProductWithRelations | null> => {
    // 1. Look up featuredProductId from SiteSetting
    const setting = await db.siteSetting.findFirst();

    if (setting?.featuredProductId) {
      const product = await db.product.findUnique({
        where: { id: setting.featuredProductId, status: 'ACTIVE' },
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
        },
      });

      if (product) return product as ProductWithRelations;
    }

    // Fallback: Return first active trending product
    const fallback = await db.product.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { trendingOrder: 'asc' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    });

    return fallback as ProductWithRelations | null;
  },
  ['featured_product'],
  {
    tags: ['featured_product', 'products'],
    revalidate: 30, // ISR fallback: 30s max staleness
  }
);

/**
 * Fetch trending products for landing section or trending catalog.
 * Tagged so revalidateTag('trending_products') instantly clears it.
 */
export function getTrendingProducts(limit = 8): Promise<ProductWithRelations[]> {
  return unstable_cache(
    async () => {
      const products = await db.product.findMany({
        where: {
          status: 'ACTIVE',
          isTrending: true,
        },
        orderBy: {
          trendingOrder: 'asc',
        },
        take: limit,
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
        },
      });

      return products as ProductWithRelations[];
    },
    [`trending_products_${limit}`],
    {
      tags: ['trending_products', 'products'],
      revalidate: 30,
    }
  )();
}

/**
 * Fetch a single product by unique slug.
 * Tagged with both product-specific tag and global products tag.
 */
export function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  return unstable_cache(
    async () => {
      const product = await db.product.findUnique({
        where: { slug, status: 'ACTIVE' },
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
        },
      });

      return product as ProductWithRelations | null;
    },
    [`product_${slug}`],
    {
      tags: [`product_${slug}`, 'products'],
      revalidate: 30,
    }
  )();
}

/**
 * List products with pagination (admin use, no caching needed)
 */
export async function listProducts(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [products, total] = await Promise.all([
    db.product.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    }),
    db.product.count(),
  ]);

  return {
    products: products as ProductWithRelations[],
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
}

// Legacy export kept for backward compatibility with any code still importing getOrSetCache directly
export { getOrSetCache };
