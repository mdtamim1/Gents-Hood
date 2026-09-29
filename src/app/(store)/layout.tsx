import React from 'react';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-cream text-ink antialiased">
        <AnnouncementBar />
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </ToastProvider>
  );
}
