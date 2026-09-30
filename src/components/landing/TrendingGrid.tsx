'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductWithRelations } from '@/types';

interface TrendingGridProps {
  products?: ProductWithRelations[];
  bannerSettings?: string | null;
}

export interface TrendingBannerConfig {
  mediaType: 'image' | 'video';
  imageUrl: string;
  videoUrl?: string;
  linkUrl: string;
  buttonText: string;
}

export const defaultTrendingBanner: TrendingBannerConfig = {
  mediaType: 'image',
  imageUrl: '/images/gentshood-collection-banner.jpg',
  videoUrl: '',
  linkUrl: '/trending',
  buttonText: 'Explore Collection',
};

/* ─── Animated scanline canvas effect (client-only) ─── */
function ScanlineCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let raf: number;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      // Horizontal scanlines
      for (let y = 0; y < height; y += 4) {
        ctx.fillStyle = `rgba(0,0,0,${0.06 + 0.03 * Math.sin((y + frame) * 0.05)})`;
        ctx.fillRect(0, y, width, 1);
      }
      frame++;
      raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    draw();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-50"
      aria-hidden="true"
    />
  );
}

export function TrendingGrid({ bannerSettings }: TrendingGridProps) {
  let bannerConfig = defaultTrendingBanner;
  if (bannerSettings) {
    try {
      bannerConfig = { ...defaultTrendingBanner, ...JSON.parse(bannerSettings) };
    } catch {
      bannerConfig = defaultTrendingBanner;
    }
  }

  const isVideo = bannerConfig.mediaType === 'video' && Boolean(bannerConfig.videoUrl);
  const linkHref = bannerConfig.linkUrl || '/trending';

  return (
    <section
      aria-label="Trending Collection"
      className="w-full border-b border-line bg-cream-soft py-8 sm:py-12"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-14">
        {/* Section label */}
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-block h-px flex-1 bg-gradient-to-r from-transparent via-[#4A0E17]/30 to-transparent" />
          <span
            style={{
              fontFamily: 'monospace',
              letterSpacing: '0.3em',
              fontSize: '0.65rem',
              color: '#4A0E17',
              textTransform: 'uppercase',
              fontWeight: 800,
            }}
          >
            BEST OF GENTS HOOD
          </span>
          <span className="inline-block h-px flex-1 bg-gradient-to-l from-transparent via-[#4A0E17]/30 to-transparent" />
        </div>

        {/* ── PREMIUM GAMING BANNER ── */}
        <div
          className="group relative overflow-hidden"
          style={{
            background: '#0a0a0a',
            boxShadow: '0 0 0 1px rgba(74,14,23,0.15), 0 16px 48px rgba(0,0,0,0.14)',
          }}
        >
          {/* Corner accent marks */}
          <span className="pointer-events-none absolute left-0 top-0 z-30 h-6 w-6 border-l-2 border-t-2 border-[#e50914]" />
          <span className="pointer-events-none absolute right-0 top-0 z-30 h-6 w-6 border-r-2 border-t-2 border-[#e50914]" />
          <span className="pointer-events-none absolute bottom-0 left-0 z-30 h-6 w-6 border-b-2 border-l-2 border-[#e50914]" />
          <span className="pointer-events-none absolute bottom-0 right-0 z-30 h-6 w-6 border-b-2 border-r-2 border-[#e50914]" />

          {/* Animated border glow line (top) */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, #e50914 40%, #ff5c6e 50%, #e50914 60%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'borderGlowSweep 3s linear infinite',
            }}
            aria-hidden="true"
          />

          {/* Media area – compact cinematic ratio */}
          <div
            className="relative w-full overflow-hidden"
            style={{ aspectRatio: '21/8', minHeight: '200px', maxHeight: '400px' }}
          >
            {isVideo ? (
              <div className="relative h-full w-full">
                {bannerConfig.videoUrl?.includes('youtube') ||
                bannerConfig.videoUrl?.includes('embed') ? (
                  <iframe
                    src={bannerConfig.videoUrl}
                    title="Gents Hood Collection"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    className="h-full w-full border-0 object-cover"
                  />
                ) : (
                  <video
                    src={bannerConfig.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            ) : (
              <Image
                src={bannerConfig.imageUrl || '/images/gentshood-collection-banner.jpg'}
                alt="Gents Hood Premium Mens Fashion"
                fill
                priority
                className="object-contain object-center transition-transform duration-700 ease-out group-hover:scale-[1.015] sm:object-cover"
              />
            )}

            {/* Scanline canvas overlay (client-only, no hydration issues) */}
            <ScanlineCanvas />

            {/* Deep gradient overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-20"
              style={{
                background:
                  'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%), linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 55%)',
              }}
            />

            {/* Content overlay (pointer-events on buttons only) */}
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end p-4 sm:p-6 md:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                {/* Left: Text — clicking takes to collection */}
                <Link
                  href={linkHref}
                  className="pointer-events-auto flex flex-col gap-1"
                  tabIndex={0}
                >
                  <span className="animate-5d-badge block font-mono text-[9px] font-bold uppercase tracking-[0.35em] sm:text-[11px]">
                    ★ Curated Premium Selection
                  </span>
                  <h2 className="animate-5d-text text-2xl font-black uppercase leading-[0.95] tracking-[-0.02em] sm:text-3xl md:text-4xl lg:text-5xl">
                    GENTS HOOD
                  </h2>
                  <p
                    className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] sm:text-xs"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Premium mens fashion · Dhaka BD
                  </p>
                </Link>

                {/* Right: Action button */}
                <div className="pointer-events-auto flex shrink-0">
                  {/* Explore CTA */}
                  <Link
                    href={linkHref}
                    className="relative overflow-hidden px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-all duration-300 hover:border-[#e50914] hover:bg-[rgba(229,9,20,0.22)] sm:text-xs"
                    style={{
                      border: '1px solid rgba(229,9,20,0.5)',
                      background: 'rgba(229,9,20,0.10)',
                    }}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 hover:translate-x-full"
                      aria-hidden="true"
                    />
                    {bannerConfig.buttonText || 'Explore Collection'} →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom HUD Marquee Bar */}
          <div
            className="relative flex h-[34px] w-full select-none items-center overflow-hidden"
            style={{
              background:
                'linear-gradient(90deg, rgba(13,2,4,0.94) 0%, rgba(28,5,9,0.98) 50%, rgba(13,2,4,0.94) 100%)',
              borderTop: '1px solid rgba(229,9,20,0.22)',
            }}
          >
            <div
              className="animate-marquee-ticker flex items-center whitespace-nowrap"
              style={{ animationDuration: '14s' }}
            >
              {/* Set 1 */}
              {[
                'BEST OF GENTS HOOD',
                'PREMIUM COLLECTIONS',
                'BEST OF GENTS HOOD',
                'PREMIUM COLLECTIONS',
              ].map((text, idx) => (
                <div key={`hud-s1-${idx}`} className="flex items-center gap-2.5 px-5 sm:px-8">
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#e50914] shadow-[0_0_8px_rgba(229,9,20,0.9)]"
                    style={{ animation: 'hudDot 1.6s ease-in-out infinite' }}
                  />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/85 sm:text-[10px]">
                    {text}
                  </span>
                  <span className="ml-5 select-none font-mono text-[9px] text-white/20 sm:ml-8">
                    /
                  </span>
                </div>
              ))}

              {/* Set 2 (Duplicated for 100% Seamless Infinite Loop) */}
              {[
                'BEST OF GENTS HOOD',
                'PREMIUM COLLECTIONS',
                'BEST OF GENTS HOOD',
                'PREMIUM COLLECTIONS',
              ].map((text, idx) => (
                <div key={`hud-s2-${idx}`} className="flex items-center gap-2.5 px-5 sm:px-8">
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#e50914] shadow-[0_0_8px_rgba(229,9,20,0.9)]"
                    style={{ animation: 'hudDot 1.6s ease-in-out infinite' }}
                  />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-white/85 sm:text-[10px]">
                    {text}
                  </span>
                  <span className="ml-5 select-none font-mono text-[9px] text-white/20 sm:ml-8">
                    /
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
