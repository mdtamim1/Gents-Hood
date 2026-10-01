import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/permissions';
import { getInquiryStats } from '@/lib/services/inquiry.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const stats = await getInquiryStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    console.error('[ADMIN_QUERY_STATS_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch query statistics' },
      { status: 500 }
    );
  }
}
