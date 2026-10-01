import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Handled at midnight (12:00 AM) to perform automatic maintenance:
 * - Cleans up old staff sessions older than 30 days
 * - Keeps database lightweight and performant
 * Vercel Cron triggers this via HTTP GET
 */
async function handleMidnightReset(request: NextRequest) {
  try {
    // Secret check to ensure only Vercel Cron or authorized admin can call
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'CRON_SECRET is not configured' },
        { status: 500 }
      );
    }

    const expectedSecret = cronSecret || 'gh-cron-secret-dev-only';
    if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Clean up old staff sessions (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const result = await db.staffSession.deleteMany({
      where: { loginAt: { lt: thirtyDaysAgo } },
    });

    return NextResponse.json({
      success: true,
      message: 'Midnight reset completed',
      clearedSessions: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Midnight reset error:', error);
    return NextResponse.json({ success: false, error: 'Reset failed' }, { status: 500 });
  }
}

// Vercel Cron invokes endpoints using GET
export async function GET(request: NextRequest) {
  return handleMidnightReset(request);
}

// Manual trigger via POST
export async function POST(request: NextRequest) {
  return handleMidnightReset(request);
}
