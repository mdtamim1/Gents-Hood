import React from 'react';
import Link from 'next/link';

interface AnnouncementBarProps {
  text?: string;
}

export function AnnouncementBar({
  text = 'FREE DELIVERY ON ORDERS ABOVE ৳1,999',
}: AnnouncementBarProps) {
  return (
    <aside
      aria-label="Announcement"
      className="relative z-40 flex h-8 w-full select-none items-center justify-between bg-ink px-4 text-[10px] font-medium uppercase tracking-widest text-cream sm:px-8 sm:text-[11px]"
    >
      <div className="flex items-center">
        <span>{text}</span>
      </div>

      <nav
        aria-label="Quick Links"
        className="hidden items-center space-x-4 text-muted-inv sm:flex"
      >
        <Link
          href="/track-order"
          className="transition-colors hover:text-cream focus-visible:text-cream focus-visible:outline-none"
        >
          Track Order
        </Link>
        <span className="select-none text-line-inv">|</span>
        <Link
          href="/contact"
          className="transition-colors hover:text-cream focus-visible:text-cream focus-visible:outline-none"
        >
          Help
        </Link>
      </nav>
    </aside>
  );
}
