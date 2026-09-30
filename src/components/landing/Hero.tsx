'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface HeroProps {
  tagline?: string | null;
  backgroundWord?: string | null;
}

export function Hero({ tagline, backgroundWord }: HeroProps) {
  const currentYear = new Date().getFullYear();

  const handleScrollToShop = () => {
    const section = document.getElementById('new-vibes');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayTagline = tagline || 'Fashion\nThat Moves\nWith You.';
  const displayWord = backgroundWord || 'GENTS HOOD';

  return (
    <section className="relative flex aspect-video w-full flex-col justify-between overflow-hidden border-b border-line bg-cream p-2.5 sm:aspect-auto sm:min-h-[640px] sm:px-10 sm:py-10 lg:min-h-[calc(100vh-5rem)] lg:px-14 lg:py-14">
      {/* Top Tagline Row (matching editorial reference) */}
      <div className="z-20 mx-auto w-full max-w-[1440px] px-1 sm:px-0">
        <div className="max-w-xs">
          <p className="label-caps text-[7.5px] leading-tight text-ink min-[380px]:text-[8px] sm:text-[11px] sm:leading-relaxed">
            {displayTagline.split('\n').map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                {idx < displayTagline.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
          <div className="mt-1 h-[1.5px] w-5 bg-ink sm:mt-2.5 sm:w-8" />
        </div>
      </div>

      {/* Center Giant Editorial Typography & Overlapping Model */}
      <div className="relative my-0 flex w-full flex-1 items-center justify-center sm:my-6">
        {/* Layer 1: Giant Wordmark behind model */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-0 flex select-none items-center justify-center px-1"
        >
          <span className="whitespace-nowrap text-center text-[clamp(2.4rem,13.5vw,19rem)] font-extrabold uppercase leading-[0.85] tracking-[-0.035em] text-ink opacity-95 sm:text-[clamp(5rem,15vw,20rem)]">
            {displayWord}
          </span>
        </div>

        {/* Layer 2: Model Cutout overlapping the text (True Transparent Cutout PNG) */}
        <div className="relative z-10 mx-auto flex h-[142px] w-[102px] items-end justify-center min-[380px]:h-[156px] min-[380px]:w-[112px] min-[430px]:h-[172px] min-[430px]:w-[124px] min-[520px]:h-[192px] min-[520px]:w-[138px] sm:h-[460px] sm:w-[340px] md:h-[560px] md:w-[410px] lg:h-[680px] lg:w-[500px]">
          {/* Soft Ground Shadow matching GAZU */}
          <div
            aria-hidden="true"
            className="bg-ink/15 pointer-events-none absolute bottom-0.5 left-1/2 h-2.5 w-[65%] -translate-x-1/2 rounded-[100%] blur-sm sm:bottom-1 sm:h-4 sm:blur-md"
          />

          <div className="relative h-full w-full">
            <Image
              src="/images/hero-model.png"
              alt="Gents Hood Editorial Cutout Model"
              fill
              priority
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 410px, 500px"
              className="object-contain object-bottom drop-shadow-[0_8px_14px_rgba(23,23,24,0.18)]"
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls & Metadata */}
      <div className="z-20 mx-auto flex w-full max-w-[1440px] -translate-y-2 flex-row items-end justify-between gap-2 px-1 pb-2 sm:translate-y-0 sm:gap-6 sm:px-0 sm:pb-0">
        {/* CTAs: SHOP NOW & EXPLORE NEW IN side by side horizontally */}
        <div className="flex flex-row items-center gap-2 sm:gap-6">
          <Button
            variant="primary"
            size="sm"
            onClick={handleScrollToShop}
            className="h-auto px-3 py-1.5 text-[8.5px] uppercase tracking-looser sm:px-9 sm:py-4 sm:text-[11px]"
          >
            Shop Now
          </Button>

          <Link href="/trending" className="inline-block">
            <span className="nav-link text-[8.5px] text-ink underline decoration-1 underline-offset-4 transition-opacity hover:opacity-75 sm:text-[12px]">
              Explore New In
            </span>
          </Link>
        </div>

        {/* Dynamic Year Stamp */}
        <div className="text-right">
          <p className="label-caps text-[7.5px] leading-tight text-ink min-[380px]:text-[8px] sm:text-[11px] sm:leading-relaxed">
            New
            <br />
            Collection
            <br />
            {currentYear}
          </p>
          <div className="ml-auto mt-1 h-[1.5px] w-5 bg-ink sm:mt-2.5 sm:w-8" />
        </div>
      </div>
    </section>
  );
}
