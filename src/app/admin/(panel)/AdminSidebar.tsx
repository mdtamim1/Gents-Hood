'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Shirt,
  Sparkles,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { AdminSession } from '@/lib/auth';

interface AdminSidebarProps {
  session: AdminSession;
}

const NAV_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products & Stock', icon: Shirt },
  { href: '/admin/featured', label: 'Main Dress Selector', icon: Sparkles },
  { href: '/admin/orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/site-settings', label: 'Site Settings', icon: Settings },
];

export function AdminSidebar({ session }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="border-muted/20 flex h-16 w-full items-center justify-between border-b bg-ink px-4 text-cream lg:hidden">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold tracking-wider">GENTS HOOD</span>
          <span className="bg-muted/20 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-muted">
            Admin
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="hover:bg-muted/20 rounded p-2 text-cream"
          aria-label="Toggle Navigation"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="bg-ink/80 fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`border-muted/20 fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r bg-[#121213] text-cream transition-transform lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo / Brand Header */}
          <div className="border-muted/20 flex h-20 items-center justify-between border-b px-6">
            <div>
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold tracking-tight text-cream">
                  GENTS HOOD
                </span>
                <span className="bg-cream/10 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-widest text-cream">
                  ATELIER
                </span>
              </Link>
              <p className="text-[10px] uppercase tracking-wider text-muted">
                Store Operations Engine
              </p>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded p-1 text-muted hover:text-cream lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 px-3 py-6">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/admin/dashboard'
                  ? pathname === '/admin/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-[2px] px-3.5 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'bg-cream font-semibold text-ink'
                      : 'hover:bg-muted/10 text-muted hover:text-cream'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-ink' : 'text-muted'}`} />
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-4">
              <div className="border-muted/20 border-t px-3 pb-2 pt-4">
                <span className="text-[10px] uppercase tracking-widest text-muted">
                  Quick Store Links
                </span>
              </div>
              <Link
                href="/"
                target="_blank"
                className="hover:bg-muted/10 flex items-center justify-between rounded-[2px] px-3.5 py-2 text-xs font-medium uppercase tracking-wider text-muted transition-colors hover:text-cream"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Live Store
                </span>
              </Link>
            </div>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="border-muted/20 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="truncate text-xs font-medium text-cream">{session.email}</p>
              <span className="inline-block text-[10px] uppercase tracking-widest text-muted">
                Role: {session.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Logout"
              className="hover:bg-danger/20 rounded p-2 text-muted transition-colors hover:text-danger disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
