import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/services/audit.service';

export async function POST() {
  const session = await getAdminSession();
  if (session) {
    await createAuditLog({
      adminId: session.id,
      action: 'LOGOUT',
      entity: 'AdminUser',
      entityId: session.id,
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
