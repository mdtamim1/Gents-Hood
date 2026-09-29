'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Hero() {
  const currentYear = new Date().getFullYear();

  const handleScrollToShop = () => {
    const section = document.getElementById('new-vibes');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] w-full flex-col justify-between overflow-hidden border-b border-line bg-cream py-8 sm:py-12 lg:py-16">
      {/* Top Tagline Row */}
      <div className="z-20 mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-14">
        <div className="max-w-xs">
          <p className="label-caps leading-relaxed text-ink">
            Fashion
            <br />
            That Moves
            <br />
            With You.
          </p>
          <div className="mt-2.5 h-[1.5px] w-8 bg-ink" />
        </div>
      </div>

      {/* Center Giant Editorial Typography & Overlapping Model */}
      <div className="relative my-4 flex min-h-[380px] w-full flex-1 items-center justify-center sm:my-8 sm:min-h-[520px] lg:min-h-[640px]">
        {/* Layer 1: Giant Wordmark behind model */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-0 flex select-none items-center justify-center"
        >
          <span className="whitespace-nowrap text-center text-[clamp(4.5rem,19vw,19rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.04em] text-ink opacity-95">
            GENTS HOOD
          </span>
        </div>

        {/* Layer 2: Model Cutout overlapping the text */}
        {/* USER ASSET REPLACE NOTE: Replace /public/images/hero-model.png with your transparent cutout PNG */}
        <div className="relative z-10 mx-auto flex h-[380px] w-[280px] items-end justify-center sm:h-[520px] sm:w-[380px] md:h-[620px] md:w-[460px] lg:h-[720px] lg:w-[560px]">
          <div className="relative h-full w-full">
            <Image
              src="/images/hero-model.png"
              alt="Gents Hood Editorial Cutout Model"
              fill
              priority
              sizes="(max-width: 640px) 280px, (max-width: 1024px) 460px, 560px"
              className="object-contain object-bottom drop-shadow-[0_20px_25px_rgba(23,23,24,0.18)]"
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls & Metadata */}
      <div className="z-20 mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-end sm:gap-8 sm:px-10 lg:px-14">
        {/* CTAs: SHOP NOW & EXPLORE NEW IN */}
        <div className="flex w-full flex-wrap items-center gap-4 sm:w-auto sm:gap-6">
          <Button
            variant="primary"
            size="md"
            onClick={handleScrollToShop}
            className="w-full sm:w-auto"
          >
            Shop Now
          </Button>

          <Link href="/trending" className="w-full text-center sm:w-auto sm:text-left">
            <span className="nav-link text-ink underline decoration-1 underline-offset-4 transition-opacity hover:opacity-75">
              Explore New In
            </span>
          </Link>
        </div>

        {/* Dynamic Year Stamp */}
        <div className="text-left sm:text-right">
          <p className="label-caps leading-relaxed text-ink">
            New
            <br />
            Collection
            <br />
            {currentYear}
          </p>
          <div className="mt-2.5 h-[1.5px] w-8 bg-ink sm:ml-auto" />
        </div>
      </div>
    </section>
  );
}
