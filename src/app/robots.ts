import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://gentshood.com'
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://gentshood.com').replace(/\/+$/, '');

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
