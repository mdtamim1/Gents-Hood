import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/permissions';
import { getInquiries } from '@/lib/services/inquiry.service';
import { QueriesClient } from './QueriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminQueriesPage() {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) {
    if (auth.reason === 'forbidden' && auth.fallbackUrl) {
      redirect(auth.fallbackUrl);
    }
    redirect(`/admin/login?reason=${auth.reason}`);
  }

  const result = await getInquiries({ limit: 100 });

  return (
    <QueriesClient
      initialInquiries={JSON.parse(JSON.stringify(result.inquiries))}
      initialCounts={result.counts}
      session={auth.session}
    />
  );
}
