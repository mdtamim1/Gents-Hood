import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/permissions';
import { getSiteSettings } from '@/lib/services/settings.service';
import { SettingsFormClient } from './SettingsFormClient';

export const dynamic = 'force-dynamic';

export default async function AdminSiteSettingsPage() {
  const auth = await verifyAdminAccess('settings');
  if (!auth.authorized) {
    if (auth.reason === 'forbidden' && auth.fallbackUrl) {
      redirect(auth.fallbackUrl);
    }
    redirect(`/admin/login?reason=${auth.reason}`);
  }

  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <SettingsFormClient initialSettings={settings} />
    </div>
  );
}
