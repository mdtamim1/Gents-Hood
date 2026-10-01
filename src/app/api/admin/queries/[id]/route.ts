import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAdminAccess } from '@/lib/permissions';
import { updateInquiryStatus, deleteInquiry } from '@/lib/services/inquiry.service';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  status: z.enum(['NEW', 'REVIEWED', 'RESOLVED']),
  adminNotes: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Query ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid data' },
        { status: 400 }
      );
    }

    const updated = await updateInquiryStatus(id, parsed.data.status, parsed.data.adminNotes);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Query status updated successfully',
    });
  } catch (error: unknown) {
    console.error('[ADMIN_UPDATE_QUERY_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to update query' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Query ID is required' }, { status: 400 });
    }

    await deleteInquiry(id);

    return NextResponse.json({
      success: true,
      message: 'Query deleted successfully',
    });
  } catch (error: unknown) {
    console.error('[ADMIN_DELETE_QUERY_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Failed to delete query' }, { status: 500 });
  }
}
