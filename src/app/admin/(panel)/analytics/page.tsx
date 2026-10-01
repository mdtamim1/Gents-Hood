import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/permissions';
import { AnalyticsClient } from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const auth = await verifyAdminAccess('analytics');
  if (!auth.authorized) {
    if (auth.reason === 'forbidden' && auth.fallbackUrl) {
      redirect(auth.fallbackUrl);
    }
    redirect(`/admin/login?reason=${auth.reason}`);
  }

  return <AnalyticsClient />;
}
