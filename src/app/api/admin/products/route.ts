import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/audit.service';
import { invalidateCacheKey } from '@/lib/cache';

const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  colorHex: z.string().optional().default('#171718'),
  stock: z.number().int().nonnegative().default(0),
  sku: z.string().optional(),
});

const imageSchema = z.object({
  url: z.string().min(1, 'Image URL is required'),
  alt: z.string().optional(),
  position: z.number().int().default(0),
  isPrimary: z.boolean().default(false),
});

const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  price: z.number().int().positive('Price must be greater than 0'),
  comparePrice: z.number().int().positive().optional().nullable(),
  sku: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).default('ACTIVE'),
  isTrending: z.boolean().default(false),
  trendingOrder: z.number().int().default(0),
  fabric: z.string().optional().nullable(),
  fit: z.string().optional().nullable(),
  care: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  variants: z.array(variantSchema).min(1, 'At least one variant (size/color/stock) is required'),
  images: z.array(imageSchema).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase() || '';

    const products = await db.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : undefined,
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, products });
  } catch (error: unknown) {
    console.error('Failed to fetch admin products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message || 'Invalid product data' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Generate clean slug
    let baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existingSlug = await db.product.findUnique({ where: { slug: baseSlug } });
    if (existingSlug) {
      baseSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Default primary image if none marked
    const formattedImages =
      data.images.length > 0
        ? data.images.map((img, idx) => ({
            url: img.url,
            alt: img.alt || data.name,
            position: idx + 1,
            isPrimary: idx === 0,
          }))
        : [
            {
              url: '/images/gallery-front.jpg',
              alt: data.name,
              position: 1,
              isPrimary: true,
            },
          ];

    const product = await db.product.create({
      data: {
        name: data.name,
        slug: baseSlug,
        price: data.price,
        comparePrice: data.comparePrice,
        sku: data.sku || `GH-${Date.now().toString().slice(-6)}`,
        shortDescription: data.shortDescription,
        description: data.description,
        status: data.status,
        isTrending: data.isTrending,
        trendingOrder: data.trendingOrder,
        fabric: data.fabric,
        fit: data.fit,
        care: data.care,
        seoTitle: data.seoTitle || `${data.name} — GENTS HOOD`,
        seoDescription: data.seoDescription || data.shortDescription,
        images: {
          create: formattedImages,
        },
        variants: {
          create: data.variants.map((v) => ({
            size: v.size,
            color: v.color,
            colorHex: v.colorHex || '#171718',
            stock: v.stock,
            sku: v.sku || `${baseSlug}-${v.size}-${v.color}`.toUpperCase(),
          })),
        },
      },
      include: {
        images: true,
        variants: true,
      },
    });

    invalidateCacheKey('trending_products_8');
    invalidateCacheKey('trending_catalog');
    revalidatePath('/');
    revalidatePath('/trending');

    await createAuditLog({
      adminId: session.id,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      meta: { name: product.name, slug: product.slug, price: product.price },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error creating product' },
      { status: 500 }
    );
  }
}
