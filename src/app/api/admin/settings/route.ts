import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSiteSettings, updateSiteSettings } from '@/lib/services/settings.service';
import { verifyAdminAccess } from '@/lib/permissions';
import { createAuditLog } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

const settingsUpdateSchema = z.object({
  announcementText: z.string().optional(),
  freeDeliveryMin: z.number().int().nonnegative().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  heroTagline: z.string().optional(),
  heroBackgroundWord: z.string().optional(),
  deliveryCharges: z
    .object({
      insideDhaka: z.number().int().nonnegative(),
      outsideDhaka: z.number().int().nonnegative(),
    })
    .optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
      whatsapp: z.string().optional(),
      messenger: z.string().optional(),
    })
    .optional(),
  galleryStrip: z
    .array(
      z.object({
        id: z.string().optional(),
        title: z.string(),
        image: z.string(),
      })
    )
    .optional(),
  trendingBanner: z
    .object({
      mediaType: z.enum(['image', 'video']).default('image'),
      imageUrl: z.string().optional(),
      videoUrl: z.string().optional(),
      linkUrl: z.string().optional(),
      buttonText: z.string().optional(),
    })
    .optional(),
  trendingMarqueeText: z.string().optional(),
  manifestoLine1: z.string().optional(),
  manifestoLine2: z.string().optional(),
  faqJson: z.string().optional(),
  announcementsJson: z.string().optional(),
});

export async function GET() {
  try {
    const auth = await verifyAdminAccess('settings');
    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.reason === 'forbidden'
              ? 'Forbidden: Settings permission required'
              : 'Unauthorized',
        },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const settings = await getSiteSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    console.error('Failed to get site settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve site settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess('settings');
    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.reason === 'forbidden'
              ? 'Forbidden: Settings permission required'
              : 'Unauthorized',
        },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }
    const session = auth.session;

    const body = await request.json();
    const result = settingsUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message || 'Invalid settings' },
        { status: 400 }
      );
    }

    const data = result.data;

    const updated = await updateSiteSettings({
      announcementText: data.announcementText,
      freeDeliveryMin: data.freeDeliveryMin,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      whatsapp: data.whatsapp,
      address: data.address,
      heroTagline: data.heroTagline,
      heroBackgroundWord: data.heroBackgroundWord,
      deliveryCharges: data.deliveryCharges ? JSON.stringify(data.deliveryCharges) : undefined,
      socialLinks: data.socialLinks ? JSON.stringify(data.socialLinks) : undefined,
      galleryStripJson: data.galleryStrip ? JSON.stringify(data.galleryStrip) : undefined,
      trendingBannerJson: data.trendingBanner ? JSON.stringify(data.trendingBanner) : undefined,
      trendingMarqueeText: data.trendingMarqueeText,
      manifestoLine1: data.manifestoLine1,
      manifestoLine2: data.manifestoLine2,
      faqJson: data.faqJson,
      announcementsJson: data.announcementsJson,
    });

    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/contact');

    await createAuditLog({
      adminId: session.id,
      action: 'UPDATE_SITE_SETTINGS',
      entity: 'SiteSetting',
      entityId: updated.id,
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'Store settings updated successfully',
    });
  } catch (error: unknown) {
    console.error('Failed to update site settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
}
