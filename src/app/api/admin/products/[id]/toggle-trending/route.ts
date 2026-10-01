import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';
import { invalidateCacheKey } from '@/lib/cache';
import { createAuditLog } from '@/lib/services/audit.service';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminAccess('products');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Products permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }
    const session = auth.session;

    const product = await db.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const newTrending = !product.isTrending;

    const updated = await db.product.update({
      where: { id: params.id },
      data: { isTrending: newTrending },
    });

    invalidateCacheKey('trending_products_8');
    invalidateCacheKey('trending_catalog');
    revalidatePath('/');
    revalidatePath('/trending');

    await createAuditLog({
      adminId: session.id,
      action: 'TOGGLE_TRENDING',
      entity: 'Product',
      entityId: params.id,
      meta: { isTrending: newTrending, name: product.name },
    });

    return NextResponse.json({
      success: true,
      isTrending: updated.isTrending,
      message: `Product ${newTrending ? 'marked as Trending' : 'removed from Trending'}`,
    });
  } catch (error: unknown) {
    console.error('Failed to toggle trending:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update trending status' },
      { status: 500 }
    );
  }
}
