'use client';

import React from 'react';
import Link from 'next/link';

// Add or customize announcement messages here (they will auto-slide in an infinite marquee)
export const ANNOUNCEMENT_ITEMS = [
  {
    id: '1',
    text: 'FREE EXPRESS SHIPPING ACROSS BANGLADESH ON ORDERS OVER ৳3,000',
    link: '/trending',
    icon: '✦',
  },
  {
    id: '2',
    text: 'CASH ON DELIVERY AVAILABLE NATIONWIDE · 100% SECURE & EASY RETURNS',
    link: '/trending',
    icon: '⚡',
  },
  {
    id: '3',
    text: 'NEW SIGNATURE LUXURY COLLECTION IS LIVE NOW · LIMITED QUANTITY DROPS',
    link: '/trending',
    icon: '◆',
  },
  {
    id: '4',
    text: 'GET 10% OFF ON YOUR FIRST ORDER — USE VOUCHER CODE: GENTS10',
    link: '/trending',
    icon: '✦',
  },
  {
    id: '5',
    text: 'PREMIUM COMBED HEAVYWEIGHT COTTON & BESPOKE TAILORED DRAPE',
    link: '/trending',
    icon: '★',
  },
];

interface AnnouncementBarProps {
  text?: string | null;
  items?: { id: string; text: string; link?: string; icon?: string }[];
}

export const AnnouncementBar = React.memo(function AnnouncementBar({
  text,
  items,
}: AnnouncementBarProps) {
  const displayItems = React.useMemo(() => {
    if (items && items.length > 0) return items;
    if (text) {
      const parts = text
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length > 0) {
        return parts.map((t, idx) => ({
          id: String(idx + 1),
          text: t,
          link: '/trending',
          icon: '✦',
        }));
      }
    }
    return ANNOUNCEMENT_ITEMS;
  }, [items, text]);

  // Keep marquee track under ~2500px per set to stay within mobile GPU texture limits and prevent micro-stutters
  const seamlessItems = React.useMemo(() => {
    if (!displayItems || displayItems.length === 0) return displayItems;
    let list = displayItems;
    while (list.length < 4) {
      list = [...list, ...displayItems];
    }
    return list;
  }, [displayItems]);

  return (
    <aside
      aria-label="Store Announcements"
      className="relative z-30 flex h-[34px] w-full select-none items-center overflow-hidden border-b border-black/15"
      style={{
        background: 'linear-gradient(90deg, #1b0407 0%, #4A0E17 50%, #1b0407 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        contain: 'paint layout',
        transform: 'translate3d(0,0,0)',
        WebkitTransform: 'translate3d(0,0,0)',
      }}
    >
      {/* Seamless Infinite Auto-Sliding Marquee Track with Hardware Acceleration */}
      <div
        className="animate-marquee-ticker flex items-center whitespace-nowrap"
        style={{
          animationDuration: '28s',
          willChange: 'transform',
          transform: 'translate3d(0,0,0)',
          WebkitTransform: 'translate3d(0,0,0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {/* Set 1 */}
        {seamlessItems.map((item, idx) => (
          <div key={`s1-${idx}`} className="flex items-center">
            <Link
              href={item.link || '/trending'}
              className="inline-flex items-center gap-2 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/95 transition-opacity hover:opacity-75 sm:text-[11px]"
            >
              <span className="font-mono text-[9px] text-[#ff5c6e]">{item.icon || '✦'}</span>
              <span>{item.text}</span>
            </Link>
            <span className="select-none font-mono text-[9px] text-white/20">/</span>
          </div>
        ))}

        {/* Set 2 (Duplicated for 100% Seamless Infinite Loop) */}
        {seamlessItems.map((item, idx) => (
          <div key={`s2-${idx}`} className="flex items-center">
            <Link
              href={item.link || '/trending'}
              className="inline-flex items-center gap-2 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/95 transition-opacity hover:opacity-75 sm:text-[11px]"
            >
              <span className="font-mono text-[9px] text-[#ff5c6e]">{item.icon || '✦'}</span>
              <span>{item.text}</span>
            </Link>
            <span className="select-none font-mono text-[9px] text-white/20">/</span>
          </div>
        ))}
      </div>
    </aside>
  );
});
