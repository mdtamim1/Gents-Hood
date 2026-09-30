import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/orders/midnight-reset
 * Called at midnight (12:00 AM) to reset Today, Completed, Cancelled sections
 * All Orders section is never touched
 * This should be called via a scheduled job or Vercel Cron
 */
export async function POST(request: NextRequest) {
  try {
    // Simple secret check to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'gh-cron-secret-2024';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // We don't actually delete orders - they stay in All Orders
    // The "reset" is handled client-side by filtering by date
    // But we can log when the reset happened

    const now = new Date();

    // Clean up old staff sessions (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await db.staffSession.deleteMany({
      where: { loginAt: { lt: thirtyDaysAgo } },
    });

    return NextResponse.json({
      success: true,
      message: 'Midnight reset completed',
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Midnight reset error:', error);
    return NextResponse.json({ success: false, error: 'Reset failed' }, { status: 500 });
  }
}
