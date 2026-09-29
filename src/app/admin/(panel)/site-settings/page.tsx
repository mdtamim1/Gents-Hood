import React from 'react';
import { getSiteSettings } from '@/lib/services/settings.service';
import { SettingsFormClient } from './SettingsFormClient';

export const dynamic = 'force-dynamic';

export default async function AdminSiteSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="space-y-6">
      <SettingsFormClient initialSettings={settings} />
    </div>
  );
}
