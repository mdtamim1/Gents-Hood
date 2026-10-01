import { redirect } from 'next/navigation';
import { verifyAdminAccess, getFirstAllowedPath } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function AdminRootPage() {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) {
    redirect('/admin/login');
  }
  redirect(getFirstAllowedPath(auth.user));
}

