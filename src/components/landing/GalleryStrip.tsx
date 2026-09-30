'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

export interface GalleryPreviewItem {
  id: string;
  title: string;
  image: string;
  alt?: string;
}

const DEFAULT_GALLERY_ITEMS: GalleryPreviewItem[] = [
  {
    id: '1',
    title: 'Front View',
    image: '/images/gallery-front.jpg',
    alt: 'Product Front Silhouette View',
  },
  {
    id: '2',
    title: 'Texture & Detail',
    image: '/images/gallery-detail.jpg',
    alt: 'Fabric Weave & Texture Detail',
  },
  {
    id: '3',
    title: 'Silhouette Fit',
    image: '/images/gallery-lifestyle.jpg',
    alt: 'Lookbook Lifestyle Fit Silhouette',
  },
];

interface GalleryStripProps {
  items?: GalleryPreviewItem[];
}

export function GalleryStrip({ items = DEFAULT_GALLERY_ITEMS }: GalleryStripProps) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const activeItem = activeLightboxIndex !== null ? items[activeLightboxIndex] : null;

  const handleClose = useCallback(() => {
    setActiveLightboxIndex(null);
  }, []);

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (activeLightboxIndex === null) return;
      setActiveLightboxIndex((prev) => (prev !== null ? (prev + 1) % items.length : null));
    },
    [activeLightboxIndex, items.length]
  );

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (activeLightboxIndex === null) return;
      setActiveLightboxIndex((prev) =>
        prev !== null ? (prev - 1 + items.length) % items.length : null
      );
    },
    [activeLightboxIndex, items.length]
  );

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeLightboxIndex, handleClose, handleNext, handlePrev]);

  return (
    <>
      <section
        aria-label="Product Image Previews"
        className="w-full border-y border-[#360910] bg-[#4A0E17] py-2.5 text-cream sm:py-5 md:py-6"
      >
        <div className="mx-auto max-w-[1440px] px-3 sm:px-8 lg:px-14">
          {/* 3-Column Image Preview Strip */}
          <div className="grid grid-cols-3 gap-2 divide-x divide-white/15 sm:gap-6 md:gap-8 lg:gap-12">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveLightboxIndex(index)}
                aria-label={`View full preview: ${item.title}`}
                className={`group flex items-center gap-2 text-left transition-opacity hover:opacity-90 sm:gap-4 md:gap-5 ${
                  index !== 0 ? 'pl-2 sm:pl-6 md:pl-8 lg:pl-12' : ''
                }`}
              >
                {/* Thumbnail Canvas */}
                <div className="relative h-[48px] w-[36px] flex-shrink-0 overflow-hidden border border-white/20 bg-black/20 sm:h-[72px] sm:w-[54px] md:h-[84px] md:w-[64px]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 36px, (max-width: 768px) 54px, 64px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Subtle click hint icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-[10px] text-cream">🔍</span>
                  </div>
                </div>

                {/* Title Only */}
                <div className="min-w-0 flex-1">
                  <h3 className="group-hover:text-cream/80 truncate text-[10px] font-bold uppercase tracking-wider text-cream transition-colors sm:text-xs md:text-sm">
                    {item.title}
                  </h3>
                  <span className="text-cream/60 mt-0.5 hidden text-[9px] uppercase tracking-looser transition-colors group-hover:text-cream sm:inline-block">
                    Click to view ↗
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal: Customer can view the full high-res image */}
      {activeItem && activeLightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title}
          onClick={handleClose}
          className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm duration-200"
        >
          {/* Top Bar: Title, Counter & Close Button */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-4 top-4 z-10 mx-auto flex max-w-4xl items-center justify-between px-2 text-cream"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider sm:text-sm">
                {activeItem.title}
              </p>
              <p className="font-mono text-[10px] text-muted-inv">
                {activeLightboxIndex + 1} / {items.length}
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close image viewer"
              className="bg-cream/10 hover:bg-cream/20 flex h-9 w-9 items-center justify-center rounded-full text-lg text-cream transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Navigation: Prev Button */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="bg-cream/10 hover:bg-cream/25 absolute left-2 z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl text-cream transition-colors sm:left-6 sm:h-12 sm:w-12"
            >
              ‹
            </button>
          )}

          {/* Center Image Canvas */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex aspect-[3/4] max-h-[82vh] w-full max-w-[90vw] items-center justify-center sm:max-w-2xl md:max-w-3xl"
          >
            <Image
              src={activeItem.image}
              alt={activeItem.alt || activeItem.title}
              fill
              priority
              sizes="(max-width: 768px) 90vw, 768px"
              className="select-none object-contain drop-shadow-2xl"
            />
          </div>

          {/* Navigation: Next Button */}
          {items.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="bg-cream/10 hover:bg-cream/25 absolute right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full text-xl text-cream transition-colors sm:right-6 sm:h-12 sm:w-12"
            >
              ›
            </button>
          )}

          {/* Bottom Bar: Caption */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-4 mx-auto text-center"
          >
            <span className="bg-ink/70 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-widest text-muted-inv backdrop-blur-sm">
              Press ESC or tap background to close
            </span>
          </div>
        </div>
      )}
    </>
  );
}
