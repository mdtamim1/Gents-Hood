import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminAccess } from '@/lib/permissions';
import { getInquiries } from '@/lib/services/inquiry.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);

    const result = await getInquiries({
      status,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.inquiries,
      pagination: result.pagination,
      counts: result.counts,
    });
  } catch (error: unknown) {
    console.error('[ADMIN_GET_QUERIES_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer queries' },
      { status: 500 }
    );
  }
}
