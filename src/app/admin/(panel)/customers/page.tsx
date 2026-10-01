import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminCustomersPage() {
  redirect('/admin/orders');
}
