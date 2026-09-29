import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import { AdminSidebar } from './AdminSidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-[#141416] text-cream antialiased lg:flex-row">
        <AdminSidebar session={session} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
