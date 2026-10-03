import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { invalidateCacheKey } from '@/lib/cache';

/**
 * Fetch site settings with Next.js Data Cache tagging.
 * Tagged with 'site_settings' so revalidateTag('site_settings') instantly clears it.
 */
export const getSiteSettings = unstable_cache(
  async () => {
    let settings = await db.siteSetting.findFirst();

    if (!settings) {
      settings = await db.siteSetting.create({
        data: {
          announcementText: null,
          freeDeliveryMin: 0,
          contactPhone: '01623-095187',
          contactEmail: 'gentshoodd@gmail.com',
          whatsapp: '01623-095187',
          address: 'Faridpur, Dhaka, Bangladesh',
          heroTagline: 'Fashion That Moves With You',
          heroBackgroundWord: 'GENTS HOOD',
          deliveryCharges: JSON.stringify({
            insideDhaka: 70,
            outsideDhaka: 130,
          }),
        },
      });
    }

    return settings;
  },
  ['site_settings'],
  {
    tags: ['site_settings'],
    revalidate: 30, // ISR fallback: max 30s staleness
  }
);

export async function updateSiteSettings(data: {
  featuredProductId?: string | null;
  announcementText?: string;
  freeDeliveryMin?: number;
  contactPhone?: string;
  contactEmail?: string;
  whatsapp?: string;
  address?: string;
  heroTagline?: string;
  heroBackgroundWord?: string;
  deliveryCharges?: string;
  socialLinks?: string;
  galleryStripJson?: string;
  trendingBannerJson?: string;
  trendingMarqueeText?: string;
  manifestoLine1?: string;
  manifestoLine2?: string;
  faqJson?: string;
  announcementsJson?: string;
}) {
  const current = await getSiteSettings();

  const updated = await db.siteSetting.update({
    where: { id: current.id },
    data,
  });

  // Invalidate Redis cache layers (L1 + L2)
  await Promise.all([invalidateCacheKey('site_settings'), invalidateCacheKey('featured_product')]);

  return updated;
}
