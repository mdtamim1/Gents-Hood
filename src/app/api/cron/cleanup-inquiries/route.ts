import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { purgeExpiredInquiries } from '@/lib/services/inquiry.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check optional authorization header if CRON_SECRET is set
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const purgedCount = await purgeExpiredInquiries();
    return NextResponse.json({
      success: true,
      message: `Successfully purged ${purgedCount} expired inquiries (7-day policy).`,
      purgedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[CRON_CLEANUP_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to purge expired inquiries' },
      { status: 500 }
    );
  }
}
