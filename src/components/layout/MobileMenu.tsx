'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Trending', href: '/trending' },
    { label: 'Contact', href: '/contact' },
    { label: 'Track Order', href: '/track-order' },
    { label: 'Account', href: '/account' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 flex flex-col bg-ink text-cream transition-all duration-300 sm:hidden"
    >
      {/* Top Bar with Logo & Close */}
      <div className="flex h-16 items-center justify-between border-b border-line-inv px-6">
        <span className="text-lg font-bold uppercase tracking-[0.2em]">GENTS HOOD</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="p-2 text-cream hover:opacity-75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cream"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-6 py-12">
        <ul className="space-y-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onClose}
                className="block text-2xl font-semibold uppercase tracking-looser transition-colors hover:text-muted-inv focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cream"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer info in menu */}
        <div className="space-y-4 border-t border-line-inv pt-8 text-xs uppercase tracking-widest text-muted-inv">
          <p>Fashion that moves with you</p>
          <p className="text-[10px]">© {new Date().getFullYear()} GENTS HOOD</p>
        </div>
      </nav>
    </div>
  );
}
