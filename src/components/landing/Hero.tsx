'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface HeroProps {
  tagline?: string | null;
  backgroundWord?: string | null;
}

export function Hero({ tagline: _tagline, backgroundWord }: HeroProps) {
  const handleScrollToShop = () => {
    const section = document.getElementById('new-vibes');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayWord = backgroundWord || 'GENTS HOOD';

  return (
    <section className="relative flex aspect-video w-full flex-col justify-between overflow-hidden border-b border-line bg-cream p-2.5 sm:aspect-auto sm:min-h-[640px] sm:px-10 sm:py-10 lg:min-h-[calc(100vh-5rem)] lg:px-14 lg:py-14">
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

      {/* Bottom Controls: SHOP NOW on Left, EXPLORE NEW IN on Right */}
      <div className="z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between px-2 pb-1.5 sm:px-0 sm:pb-0">
        {/* Left: SHOP NOW Button */}
        <div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleScrollToShop}
            className="h-auto px-3.5 py-1.5 text-[8.5px] uppercase tracking-wider min-[380px]:px-4 min-[380px]:py-2 min-[380px]:text-[9.5px] sm:px-9 sm:py-4 sm:text-[11px] sm:tracking-looser"
          >
            Shop Now
          </Button>
        </div>

        {/* Right: EXPLORE NEW IN Link (placed where red marked option was) */}
        <div>
          <Link href="/trending" className="inline-flex items-center">
            <span className="text-[8.5px] font-semibold uppercase tracking-wider text-ink underline decoration-1 underline-offset-4 transition-opacity hover:opacity-75 min-[380px]:text-[9.5px] sm:text-[12px] sm:tracking-[0.12em]">
              Explore New In
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
