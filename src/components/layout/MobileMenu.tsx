'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isFirstRender = React.useRef(true);

  // Clean transition driven purely by isOpen
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isOpen) setIsMounted(true);
      return;
    }

    if (isOpen) {
      setIsMounted(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
      }, 380);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isMounted) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMounted, handleKeyDown]);

  if (!isMounted) return null;

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Trending', href: '/trending' },
    { label: 'Contact', href: '/contact' },
    { label: 'Track Order', href: '/track-order' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
      className="fixed inset-0 z-50 sm:hidden"
    >
      {/* Dark Blurred Backdrop - tapping closes drawer with smooth fade out */}
      <div
        className={`bg-ink/75 duration-380 fixed inset-0 backdrop-blur-sm transition-opacity ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 3D Mobile Menu Drawer with Opening and Closing Animations */}
      <aside
        className={`relative z-10 flex h-full w-[78%] max-w-[320px] flex-col border-r border-white/15 bg-[#4A0E17] text-cream shadow-[16px_0_40px_rgba(0,0,0,0.65)] ${
          isClosing ? 'animate-drawer-3d-close' : 'animate-drawer-3d'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Center-Aligned Logo & Close Button */}
        <div className="relative flex h-16 items-center justify-center border-b border-white/15 px-6">
          <Link
            href="/"
            onClick={onClose}
            aria-label="Gents Hood Home"
            className="flex select-none items-center justify-center py-1 transition-opacity hover:opacity-85"
          >
            <div className="relative h-10 w-28">
              <Image
                src="/images/logo.png"
                alt="Gents Hood"
                fill
                priority
                className="object-contain brightness-0 invert"
                sizes="112px"
              />
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="text-cream/80 absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-transform duration-200 hover:bg-white/10 hover:text-cream active:scale-90"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation List with 3D Staggered Animation */}
        <nav className="flex flex-1 flex-col justify-between overflow-y-auto px-6 py-10">
          <ul className="space-y-6">
            {navLinks.map((link, idx) => (
              <li
                key={link.href}
                className={isClosing ? undefined : 'animate-nav-item'}
                style={{ animationDelay: `${idx * 60 + 80}ms` }}
              >
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="group flex items-center justify-between py-1 text-xl font-bold uppercase tracking-looser text-cream transition-all duration-200 hover:translate-x-2 hover:text-white"
                >
                  <span>{link.label}</span>
                  <span className="text-cream/40 text-xs transition-transform duration-200 group-hover:translate-x-1 group-hover:text-cream">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Footer info in menu */}
          <div className="text-cream/70 space-y-3 border-t border-white/15 pt-6 text-xs uppercase tracking-widest">
            <p className="text-cream/80 text-[11px] font-semibold">Fashion that moves with you</p>
            <p className="text-cream/50 font-mono text-[10px]">
              © {new Date().getFullYear()} GENTS HOOD
            </p>
          </div>
        </nav>
      </aside>
    </div>
  );
}
