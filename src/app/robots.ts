import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/constants/site';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/api/orders/', '/order-success/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
