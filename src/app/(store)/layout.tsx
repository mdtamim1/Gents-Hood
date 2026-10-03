import React from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';
import { getSiteSettings } from '@/lib/services/settings.service';

// ISR fallback for layout: 10s — on-demand revalidation is instant via revalidateTag
export const revalidate = 10;

const CartDrawer = dynamic(
  () => import('@/components/cart/CartDrawer').then((mod) => mod.CartDrawer),
  { ssr: false }
);

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const siteSettings = await getSiteSettings();

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-cream text-ink antialiased">
        <Header
          announcementText={siteSettings?.announcementText}
          announcementsJson={siteSettings?.announcementsJson}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </ToastProvider>
  );
}
