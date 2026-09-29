'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { MobileMenu } from './MobileMenu';

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
              className="p-1.5 text-ink hover:opacity-75 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
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
              className="select-none text-xl font-extrabold uppercase tracking-[0.25em] text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink sm:text-2xl lg:text-[26px]"
            >
              GENTS HOOD
            </Link>
          </div>

          {/* Right: Actions (Track Order, Account, Cart) */}
          <div className="flex items-center space-x-6 sm:space-x-8">
            <Link
              href="/track-order"
              className="nav-link hidden items-center text-ink transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink lg:flex"
            >
              Track Order
            </Link>

            <Link
              href="/account"
              aria-label="User Account"
              className="nav-link hidden items-center space-x-1.5 text-ink transition-colors hover:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink sm:flex"
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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <span>Account</span>
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
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
