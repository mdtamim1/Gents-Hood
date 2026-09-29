import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/audit.service';
import { invalidateCacheKey } from '@/lib/cache';

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().int().positive().optional(),
  comparePrice: z.number().int().positive().optional().nullable(),
  sku: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  isTrending: z.boolean().optional(),
  trendingOrder: z.number().int().optional(),
  fabric: z.string().optional().nullable(),
  fit: z.string().optional().nullable(),
  care: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDescription: z.string().optional().nullable(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.string(),
        color: z.string(),
        colorHex: z.string().optional().nullable(),
        stock: z.number().int().nonnegative(),
        sku: z.string().optional().nullable(),
      })
    )
    .optional(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { position: 'asc' } },
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: unknown) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = updateProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const data = result.data;

    const existingProduct = await db.product.findUnique({
      where: { id: params.id },
      include: { variants: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Update product fields
    const updatedProduct = await db.product.update({
      where: { id: params.id },
      data: {
        name: data.name,
        price: data.price,
        comparePrice: data.comparePrice,
        sku: data.sku,
        shortDescription: data.shortDescription,
        description: data.description,
        status: data.status,
        isTrending: data.isTrending,
        trendingOrder: data.trendingOrder,
        fabric: data.fabric,
        fit: data.fit,
        care: data.care,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      },
    });

    // Update variants if provided
    if (data.variants && data.variants.length > 0) {
      // Delete existing variants and re-insert
      await db.productVariant.deleteMany({
        where: { productId: params.id },
      });

      await db.productVariant.createMany({
        data: data.variants.map((v) => ({
          productId: params.id,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || '#171718',
          stock: v.stock,
          sku: v.sku || `${existingProduct.slug}-${v.size}-${v.color}`.toUpperCase(),
        })),
      });
    }

    invalidateCacheKey('featured_product');
    invalidateCacheKey('trending_products_8');
    invalidateCacheKey('trending_catalog');
    revalidatePath('/');
    revalidatePath('/trending');
    revalidatePath(`/product/${existingProduct.slug}`);

    await createAuditLog({
      adminId: session.id,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: params.id,
      meta: { name: updatedProduct.name },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: unknown) {
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    await db.product.delete({
      where: { id: params.id },
    });

    invalidateCacheKey('featured_product');
    invalidateCacheKey('trending_products_8');
    invalidateCacheKey('trending_catalog');
    revalidatePath('/');
    revalidatePath('/trending');

    await createAuditLog({
      adminId: session.id,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: params.id,
      meta: { name: product.name, slug: product.slug },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: unknown) {
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
