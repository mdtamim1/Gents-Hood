import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';
import { notifyIndexNow, notifyGoogleIndexing } from '@/lib/services/indexing.service';
import { getSiteUrl } from '@/lib/constants/site';
import { createAuditLog } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    const siteUrl = getSiteUrl();
    let targetUrls: string[] = [];

    try {
      const body = await request.json();
      if (Array.isArray(body?.urls) && body.urls.length > 0) {
        targetUrls = body.urls;
      }
    } catch {
      // Body not provided, default to all primary pages + active products
    }

    if (targetUrls.length === 0) {
      const products = await db.product.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true },
      });

      targetUrls = [
        `${siteUrl}`,
        `${siteUrl}/trending`,
        `${siteUrl}/contact`,
        `${siteUrl}/sitemap.xml`,
        ...products.map((p) => `${siteUrl}/product/${p.slug}`),
      ];
    }

    const [indexNowSuccess, googleNotifiedCount] = await Promise.all([
      notifyIndexNow(targetUrls),
      notifyGoogleIndexing(targetUrls, 'URL_UPDATED'),
    ]);

    await createAuditLog({
      adminId: auth.session!.id,
      action: 'PING_SEARCH_ENGINES',
      entity: 'SearchIndexing',
      meta: {
        totalUrls: targetUrls.length,
        indexNowSuccess,
        googleNotifiedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Search engines notified for ${targetUrls.length} URLs.`,
      indexNowSuccess,
      googleNotifiedCount,
      urls: targetUrls,
    });
  } catch (error: unknown) {
    console.error('Failed to notify search engines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to notify search engines' },
      { status: 500 }
    );
  }
}
