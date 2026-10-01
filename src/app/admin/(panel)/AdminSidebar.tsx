'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Shirt,
  ShoppingBag,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Wifi,
  WifiOff,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';

interface AdminSidebarProps {
  session: {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'STAFF';
    displayColor: string;
    permissions?: Record<string, boolean>;
  };
}

const NAV_LINKS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permissionKey?: string;
  ownerOnly: boolean;
}> = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permissionKey: 'dashboard',
    ownerOnly: false,
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: ShoppingBag,
    permissionKey: 'orders',
    ownerOnly: false,
  },
  { href: '/admin/queries', label: 'Check Query', icon: MessageSquare, ownerOnly: false },
  {
    href: '/admin/appeals',
    label: 'Appeals',
    icon: ShieldAlert,
    permissionKey: 'orders',
    ownerOnly: false,
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: Shirt,
    permissionKey: 'products',
    ownerOnly: false,
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
    permissionKey: 'analytics',
    ownerOnly: false,
  },
  { href: '/admin/staff', label: 'Staff', icon: UserCheck, ownerOnly: true },
  {
    href: '/admin/site-settings',
    label: 'Settings',
    icon: Settings,
    permissionKey: 'settings',
    ownerOnly: false,
  },
];

export function AdminSidebar({ session }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [newQueriesCount, setNewQueriesCount] = useState<number>(0);

  // Poll new queries count for live badge
  const fetchQueryStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/queries/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && typeof json.data?.newCount === 'number') {
          setNewQueriesCount(json.data.newCount);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Heartbeat to keep session alive & check for deactivation
  const heartbeat = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/me');
      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'Account deactivated') {
          router.push('/admin/login?reason=deactivated');
        } else if (data.error === 'Session expired. Please login again.') {
          router.push('/admin/login?reason=session_expired');
        }
      }
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, [router]);

  useEffect(() => {
    // Initial check
    heartbeat();
    fetchQueryStats();
    // Check every 30 seconds
    const interval = setInterval(() => {
      heartbeat();
      fetchQueryStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [heartbeat, fetchQueryStats]);

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

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (session.role === 'OWNER') return true;
    if (link.ownerOnly) return false;
    if (link.permissionKey) {
      return !!session.permissions?.[link.permissionKey];
    }
    return false;
  });

  const homeHref =
    session.role === 'OWNER' || session.permissions?.dashboard
      ? '/admin/dashboard'
      : visibleLinks[0]?.href || '/admin/orders';

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-white/[0.06] px-6 py-5">
        <Link href={homeHref} className="block">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-1 shadow-md shadow-black/40">
              <Image
                src="/images/logo.png"
                alt="Gents Hood"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-wide text-white">GENTS HOOD</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                Admin Console
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {visibleLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'text-white/50 hover:bg-white/[0.05] hover:text-white/90'
                }`}
              >
                <Icon
                  className={`h-4 w-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-indigo-400' : 'text-white/30 group-hover:text-white/60'
                  }`}
                />
                <span className="flex-1">{label}</span>
                {label === 'Check Query' && newQueriesCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[10px] font-bold text-rose-300 ring-1 ring-rose-500/40">
                    {newQueriesCount}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-indigo-400/60" />}
              </Link>
            );
          })}
        </div>

        {/* View Store */}
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-medium text-white/30 transition-all hover:bg-white/[0.04] hover:text-white/60"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>View Store</span>
          </a>
        </div>
      </nav>

      {/* User / Logout */}
      <div className="border-t border-white/[0.06] p-4">
        {/* Connection status */}
        <div
          className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{isOnline ? 'Connected & Live' : 'Connection Lost'}</span>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-lg"
            style={{ backgroundColor: session.displayColor }}
          >
            {getInitials(session.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-white/90">{session.name}</p>
            <p className="truncate text-[10px] text-white/35">
              {session.role === 'OWNER' ? '👑 Owner' : '🔧 Staff'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-red-500/15 hover:text-red-400 disabled:opacity-50"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0b] px-4 lg:hidden">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white p-0.5 shadow-sm">
            <Image src="/images/logo.png" alt="Gents Hood" fill className="object-contain p-0.5" />
          </div>
          <span className="text-[13px] font-bold text-white">GENTS HOOD</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.05] hover:text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-white/[0.06] bg-[#0f0f11] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile spacer */}
      <div className="h-14 lg:hidden" />
    </>
  );
}
