import { db } from '@/lib/db';
import { getOrSetCache } from '@/lib/cache';
import { ProductWithRelations } from '@/types';

/**
 * Fetch the current Featured / Main product configured in SiteSettings
 */
export async function getFeaturedProduct(): Promise<ProductWithRelations | null> {
  return getOrSetCache('featured_product', 60, async () => {
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
  });
}

/**
 * Fetch trending products for landing section or trending catalog
 */
export async function getTrendingProducts(limit = 8): Promise<ProductWithRelations[]> {
  return getOrSetCache(`trending_products_${limit}`, 60, async () => {
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
  });
}

/**
 * Fetch a single product by unique slug
 */
export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  return getOrSetCache(`product_${slug}`, 60, async () => {
    const product = await db.product.findUnique({
      where: { slug, status: 'ACTIVE' },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    });

    return product as ProductWithRelations | null;
  });
}

/**
 * List products with pagination
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
