import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { getSiteUrl } from '@/lib/constants/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    const products = await db.product.findMany({
      where: { status: 'ACTIVE' },
      select: {
        slug: true,
        updatedAt: true,
        images: {
          select: { url: true },
          take: 3,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const toAbsoluteUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: product.images.map((img) => toAbsoluteUrl(img.url)).filter(Boolean),
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error('Failed to generate dynamic product sitemap:', error);
    return staticRoutes;
  }
}
