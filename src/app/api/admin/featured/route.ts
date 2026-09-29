import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { updateSiteSettings } from '@/lib/services/settings.service';
import { getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/audit.service';

const featuredSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = featuredSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message || 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { productId } = result.data;

    // Verify product exists and is active
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

    // Revalidate home page ISR cache
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
      message: `"${product.name}" is now set as the Homepage Main Product.`,
    });
  } catch (error: unknown) {
    console.error('Failed to update featured product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update featured product' },
      { status: 500 }
    );
  }
}
