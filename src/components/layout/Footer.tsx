'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto w-full bg-ink pb-12 pt-16 text-cream">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* Brand Header */}
        <div className="flex flex-col items-start justify-between gap-8 border-b border-line-inv pb-12 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold uppercase tracking-[0.2em] text-cream sm:text-4xl">
              GENTS HOOD
            </h2>
            <p className="mt-2 text-xs uppercase tracking-widest text-muted-inv">
              Fashion That Moves With You
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center space-x-2 border border-line-inv px-4 py-2 text-[11px] font-medium uppercase tracking-looser text-cream transition-colors hover:text-muted-inv"
          >
            <span>Back to top</span>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-8 border-b border-line-inv py-12 text-xs md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-cream">
              Collection
            </h3>
            <ul className="space-y-3 text-muted-inv">
              <li>
                <Link href="/trending" className="transition-colors hover:text-cream">
                  Trending Pieces
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-cream">
                  New Vibes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-cream">
              Assistance
            </h3>
            <ul className="space-y-3 text-muted-inv">
              <li>
                <Link href="/track-order" className="transition-colors hover:text-cream">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-cream">
              Company
            </h3>
            <ul className="space-y-3 text-muted-inv">
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  About Gents Hood
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-cream">
              Direct Support
            </h3>
            <p className="leading-relaxed text-muted-inv">
              Inside & Outside Dhaka Fast Express Delivery. Cash on Delivery available nationwide.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-[11px] uppercase tracking-widest text-muted-inv sm:flex-row">
          <p>© {new Date().getFullYear()} GENTS HOOD. ALL RIGHTS RESERVED.</p>
          <p className="text-[10px]">CRAFTED FOR UNCOMPROMISED MODERN STYLE</p>
        </div>
      </div>
    </footer>
  );
}
