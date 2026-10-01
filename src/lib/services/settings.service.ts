import { db } from '@/lib/db';
import { getOrSetCache, invalidateCacheKey } from '@/lib/cache';

export async function getSiteSettings() {
  return getOrSetCache('site_settings', 120, async () => {
    let settings = await db.siteSetting.findFirst();

    if (!settings) {
      settings = await db.siteSetting.create({
        data: {
          announcementText: null,
          freeDeliveryMin: 0,
          contactPhone: '+8801700000000',
          contactEmail: 'contact@gentshood.com',
          whatsapp: '+8801700000000',
          address: 'Gulshan 2, Dhaka, Bangladesh',
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
  });
}

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

  invalidateCacheKey('site_settings');
  invalidateCacheKey('featured_product');

  return updated;
}
