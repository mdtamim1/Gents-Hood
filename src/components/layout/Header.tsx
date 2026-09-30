'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { MobileMenu } from './MobileMenu';
import { AnnouncementBar } from './AnnouncementBar';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const cartTotalItems = useCartStore((state) => state.getTotalItems());
  const setIsCartOpen = useCartStore((state) => state.setIsOpen);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full bg-cream transition-all duration-200 ${
          isScrolled ? 'border-b border-line shadow-sm' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 sm:h-20 sm:px-10 lg:px-14">
          {/* Mobile: Hamburger Button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation"
              className="p-1.5 text-ink transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink active:scale-90"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>

          {/* Desktop Left: Navigation */}
          <nav aria-label="Main Navigation" className="hidden items-center space-x-8 sm:flex">
            <Link
              href="/trending"
              className="nav-link text-ink transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
            >
              Trending
            </Link>
            <Link
              href="/contact"
              className="nav-link text-ink transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
            >
              Contact
            </Link>
          </nav>

          {/* Center: Brand Logo */}
          <div className="flex items-center justify-center">
            <Link
              href="/"
              aria-label="Gents Hood Home"
              className="group flex select-none items-center justify-center py-1 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink active:scale-95"
            >
              <div className="relative h-11 w-28 transition-transform duration-200 group-hover:scale-105 sm:h-14 sm:w-36 md:h-16 md:w-40">
                <Image
                  src="/images/logo.png"
                  alt="Gents Hood"
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 160px"
                />
              </div>
            </Link>
          </div>

          {/* Right: Actions (Track Order, Cart) */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <Link
              href="/track-order"
              className="nav-link hidden items-center text-ink transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink sm:flex"
            >
              Track Order
            </Link>

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={`Cart with ${isMounted ? cartTotalItems : 0} items`}
              className="nav-link flex items-center space-x-1.5 text-ink transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <span className="hidden sm:inline">Cart</span>
              <span>({isMounted ? cartTotalItems : 0})</span>
            </button>
          </div>
        </div>

        {/* Animated Auto-Sliding Announcement Bar */}
        <AnnouncementBar />
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
