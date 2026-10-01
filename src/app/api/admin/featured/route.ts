import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSiteSettings, updateSiteSettings } from '@/lib/services/settings.service';
import { verifyAdminAccess } from '@/lib/permissions';
import { createAuditLog } from '@/lib/services/audit.service';
import { invalidateCacheKey } from '@/lib/cache';

export const dynamic = 'force-dynamic';

const featuredSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

// GET: Fetch current signature product
export async function GET() {
  try {
    const auth = await verifyAdminAccess('products');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Products permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const settings = await getSiteSettings();
    let product = null;

    if (settings?.featuredProductId) {
      product = await db.product.findUnique({
        where: { id: settings.featuredProductId },
        include: {
          images: { orderBy: { position: 'asc' } },
          variants: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      featuredProductId: settings?.featuredProductId || null,
      product,
    });
  } catch (error: unknown) {
    console.error('Failed to get featured product:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve signature product' }, { status: 500 });
  }
}

// POST: Set signature product (enforcing max 1 limit)
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
    const result = featuredSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message || 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { productId } = result.data;

    // Check if a signature product already exists
    const currentSettings = await getSiteSettings();
    if (currentSettings?.featuredProductId && currentSettings.featuredProductId !== productId) {
      const existing = await db.product.findUnique({
        where: { id: currentSettings.featuredProductId },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: `A Signature Product already exists ("${existing.name}"). Only 1 product is allowed. Please remove the existing one before adding a new one.`,
          },
          { status: 400 }
        );
      }
    }

    // Verify target product exists and is active
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Selected product was not found' },
        { status: 404 }
      );
    }

    // Update site setting
    await updateSiteSettings({ featuredProductId: productId });

    invalidateCacheKey('featured_product');
    revalidatePath('/');

    await createAuditLog({
      adminId: session.id,
      action: 'UPDATE_FEATURED_PRODUCT',
      entity: 'SiteSetting',
      entityId: productId,
      meta: { productName: product.name, slug: product.slug },
    });

    return NextResponse.json({
      success: true,
      message: `"${product.name}" is now set as the Homepage Signature Product.`,
      product,
    });
  } catch (error: unknown) {
    console.error('Failed to update featured product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update featured product' },
      { status: 500 }
    );
  }
}

// DELETE: Remove/Clear signature product
export async function DELETE() {
  try {
    const auth = await verifyAdminAccess('products');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Products permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }
    const session = auth.session;

    const currentSettings = await getSiteSettings();
    const oldProductId = currentSettings?.featuredProductId;

    await updateSiteSettings({ featuredProductId: null });

    invalidateCacheKey('featured_product');
    revalidatePath('/');

    await createAuditLog({
      adminId: session.id,
      action: 'REMOVE_FEATURED_PRODUCT',
      entity: 'SiteSetting',
      entityId: oldProductId || 'none',
    });

    return NextResponse.json({
      success: true,
      message: 'Signature Product removed from Homepage. You can now add or upload a new Signature Product.',
    });
  } catch (error: unknown) {
    console.error('Failed to remove featured product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove featured product' },
      { status: 500 }
    );
  }
}
