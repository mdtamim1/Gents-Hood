import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/audit.service';
import { db } from '@/lib/db';

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    try {
      // Deactivate all sessions for this user
      await db.staffSession.updateMany({
        where: { staffId: session.id, isActive: true },
        data: { isActive: false, logoutAt: new Date() },
      });

      // Clear session token on user
      await db.adminUser.update({
        where: { id: session.id },
        data: {
          sessionToken: null,
          lastLogoutAt: new Date(),
        },
      });

      await createAuditLog({
        adminId: session.id,
        action: 'LOGOUT',
        entity: 'AdminUser',
        entityId: session.id,
      });
    } catch (e) {
      console.error('Logout cleanup error:', e);
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
