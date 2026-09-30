import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.adminUser.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        displayColor: true,
        permissions: true,
        lastLoginAt: true,
        sessionToken: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'Account deactivated' }, { status: 403 });
    }

    // Check session validity
    if (session.sessionToken && user.sessionToken !== session.sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    // Update last seen
    if (session.sessionToken) {
      await db.staffSession.updateMany({
        where: { staffId: session.id, token: session.sessionToken, isActive: true },
        data: { lastSeenAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        displayColor: user.displayColor,
        permissions: user.permissions ? JSON.parse(user.permissions) : null,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
