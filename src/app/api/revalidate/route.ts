import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * Cross-Domain Cache Revalidation Endpoint
 * =========================================
 * This endpoint lives on gentshood.com and is called by admin.gentshood.com
 * after any content update. It force-purges all Next.js Data Cache and
 * Full Route Cache entries for the storefront.
 *
 * WHY THIS EXISTS:
 * Next.js `revalidatePath`/`revalidateTag` only invalidates cache within the
 * SAME serverless function instance. When admin runs on a different subdomain
 * (admin.gentshood.com), its revalidate calls cannot reach main domain's cache.
 * This endpoint bridges that gap via a direct HTTP call from the admin APIs.
 *
 * Security: Protected by REVALIDATE_SECRET env var (shared between both domains).
 */
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get('x-revalidate-secret');
    const expectedSecret = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const slug: string | undefined = body?.slug;

    // 1. Tag-based revalidation (Data Cache)
    revalidateTag('site_settings');
    revalidateTag('products');
    revalidateTag('featured_product');
    revalidateTag('trending_products');
    if (slug) {
      revalidateTag(`product_${slug}`);
    }

    // 2. Path-based revalidation (Full Route Cache)
    revalidatePath('/', 'page');
    revalidatePath('/', 'layout');
    revalidatePath('/trending', 'page');
    revalidatePath('/contact', 'page');
    if (slug) {
      revalidatePath(`/product/${slug}`, 'page');
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      slug: slug || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Revalidate API] Error:', err);
    return NextResponse.json({ success: false, error: 'Revalidation failed' }, { status: 500 });
  }
}

// Also allow GET for easy testing / Vercel cron health checks
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  revalidateTag('site_settings');
  revalidateTag('products');
  revalidateTag('featured_product');
  revalidateTag('trending_products');
  revalidatePath('/', 'layout');
  revalidatePath('/', 'page');
  revalidatePath('/trending', 'page');

  return NextResponse.json({
    success: true,
    revalidated: true,
    timestamp: new Date().toISOString(),
  });
}
