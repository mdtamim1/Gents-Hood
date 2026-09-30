import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { AdminSidebar } from './AdminSidebar';
import { db } from '@/lib/db';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  // Verify account is still active
  const user = await db.adminUser.findUnique({
    where: { id: session.id },
    select: { isActive: true, name: true, role: true, displayColor: true, sessionToken: true },
  });

  if (!user) {
    redirect('/admin/login?reason=invalid_session');
  }

  if (!user.isActive) {
    redirect('/admin/login?reason=deactivated');
  }

  // Verify session token matches (force logout if changed)
  if (session.sessionToken && user.sessionToken !== session.sessionToken) {
    redirect('/admin/login?reason=session_expired');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <AdminSidebar
        session={{
          id: session.id,
          email: session.email,
          name: user.name,
          role: user.role as 'OWNER' | 'STAFF',
          displayColor: user.displayColor || '#6366f1',
        }}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-6">{children}</div>
      </main>
    </div>
  );
}
