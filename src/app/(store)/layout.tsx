import React from 'react';
import dynamic from 'next/dynamic';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';

const CartDrawer = dynamic(
  () => import('@/components/cart/CartDrawer').then((mod) => mod.CartDrawer),
  { ssr: false }
);

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-cream text-ink antialiased">
        <AnnouncementBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </ToastProvider>
  );
}
