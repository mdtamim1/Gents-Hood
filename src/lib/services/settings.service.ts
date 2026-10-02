import { db } from '@/lib/db';
import { getOrSetCache, invalidateCacheKey } from '@/lib/cache';

export async function getSiteSettings() {
  return getOrSetCache('site_settings', 60, async () => {
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

  await Promise.all([invalidateCacheKey('site_settings'), invalidateCacheKey('featured_product')]);

  return updated;
}
