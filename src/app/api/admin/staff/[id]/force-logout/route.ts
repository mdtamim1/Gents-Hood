import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminAccess();
    if (!auth.authorized || auth.user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: OWNER role required' },
        { status: 403 }
      );
    }

    // Deactivate all sessions
    await db.staffSession.updateMany({
      where: { staffId: params.id, isActive: true },
      data: { isActive: false, logoutAt: new Date() },
    });

    // Clear session token
    await db.adminUser.update({
      where: { id: params.id },
      data: { sessionToken: null },
    });

    return NextResponse.json({ success: true, message: 'Staff logged out successfully' });
  } catch (error) {
    console.error('Force logout error:', error);
    return NextResponse.json({ success: false, error: 'Failed to logout staff' }, { status: 500 });
  }
}
