import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/services/audit.service';
import { invalidateCacheKey } from '@/lib/cache';
import { getSiteSettings, updateSiteSettings } from '@/lib/services/settings.service';

export const dynamic = 'force-dynamic';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generateSku(name: string): string {
  const words = name.trim().toUpperCase().split(/\s+/);
  const prefix = words
    .slice(0, 3)
    .map((w) => w.slice(0, 3))
    .join('-');
  const suffix = Math.floor(Math.random() * 90 + 10).toString();
  return `GH-${prefix}-${suffix}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess('products');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Products permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const status = searchParams.get('status') || 'ACTIVE';

    const whereClause: Record<string, unknown> = {};
    if (status !== 'ALL') whereClause.status = status;
    if (search) {
      whereClause.OR = [{ name: { contains: search } }, { sku: { contains: search } }];
    }

    const products = await db.product.findMany({
      where: whereClause,
      include: {
        images: { orderBy: { position: 'asc' }, take: 1 },
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Products list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess('products');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Products permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }
    const session = auth.session;

    const body = await request.json();
    const {
      name,
      price,
      comparePrice,
      sku,
      shortDescription,
      description,
      fabric,
      fit,
      care,
      cutDrape,
      hardware,
      fitBadge,
      status = 'ACTIVE',
      isTrending = false,
      isSignature = false,
      images = [],   // array of { url, alt, colorHex, isPrimary }
      variants = [],
    } = body;

    if (!name || !price) {
      return NextResponse.json({ success: false, error: 'Name and price are required' }, { status: 400 });
    }

    // If uploading as Signature Product, enforce the strict "1 product only" rule
    if (isSignature) {
      const currentSettings = await getSiteSettings();
      if (currentSettings?.featuredProductId) {
        const existing = await db.product.findUnique({
          where: { id: currentSettings.featuredProductId },
        });
        if (existing) {
          return NextResponse.json(
            {
              success: false,
              error: `A Signature Product already exists ("${existing.name}"). Only 1 product can be set as the Signature Product. You must remove/delete the current Signature Product first.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Generate unique slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let attempt = 0;
    while (await db.product.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    // Auto-generate SKU if not provided
    const finalSku = sku?.trim() || generateSku(name);

    const product = await db.product.create({
      data: {
        name,
        slug,
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        sku: finalSku,
        shortDescription: shortDescription || null,
        description: description || null,
        fabric: fabric || null,
        fit: fit || null,
        care: care || null,
        cutDrape: cutDrape || null,
        hardware: hardware || null,
        fitBadge: fitBadge || 'True to Size',
        status,
        isTrending: Boolean(isTrending),
        images: {
          create: images.slice(0, 15).map(
            (img: { url: string; alt?: string; colorHex?: string; isPrimary?: boolean }, idx: number) => ({
              url: img.url,
              alt: img.alt || name,
              position: idx,
              isPrimary: idx === 0,
              colorHex: img.colorHex || null,
            })
          ),
        },
        variants: {
          create: variants.map(
            (v: { size: string; color: string; colorHex?: string; stock: number; sku?: string }) => ({
              size: v.size,
              color: v.color,
              colorHex: v.colorHex || '#171718',
              stock: Number(v.stock),
              sku: v.sku || `${slug}-${v.size}-${v.color}`.toUpperCase().replace(/\s+/g, '-'),
            })
          ),
        },
      },
      include: {
        images: true,
        variants: true,
      },
    });

    if (isSignature) {
      await updateSiteSettings({ featuredProductId: product.id });
      invalidateCacheKey('featured_product');
    }

    invalidateCacheKey('trending_products_8');
    invalidateCacheKey('trending_catalog');
    revalidatePath('/');
    revalidatePath('/trending');
    revalidatePath(`/product/${slug}`);

    await createAuditLog({
      adminId: session.id,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      meta: { name: product.name, slug: product.slug, sku: product.sku },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
  }
}
