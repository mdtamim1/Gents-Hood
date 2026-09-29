'use client';

import React from 'react';
import Image from 'next/image';

interface GalleryCardItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  image: string;
}

const GALLERY_ITEMS: GalleryCardItem[] = [
  {
    id: 'front',
    tag: 'PERSPECTIVE 01',
    title: 'FRONT PROFILE',
    description: 'Structured broad shoulders with a fluid, modern drop-chest silhouette.',
    image: '/images/gallery-front.jpg',
  },
  {
    id: 'detail',
    tag: 'PERSPECTIVE 02',
    title: 'MATERIAL & CRAFT',
    description: 'Precision double-weave cotton-wool blend with concealed storm placket.',
    image: '/images/gallery-detail.jpg',
  },
  {
    id: 'lifestyle',
    tag: 'PERSPECTIVE 03',
    title: 'MOTION & DRAPE',
    description: 'Tailored articulation allowing unrestrained comfort and fluid movement.',
    image: '/images/gallery-lifestyle.jpg',
  },
];

export function GalleryStrip() {
  const handleViewPerspective = () => {
    const section = document.getElementById('new-vibes');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      aria-label="Main Product Perspectives"
      className="w-full border-b border-line-inv bg-ink py-10 text-cream sm:py-14"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 gap-8 divide-y divide-line-inv md:grid-cols-3 md:divide-x md:divide-y-0 lg:gap-12">
          {GALLERY_ITEMS.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-center gap-5 sm:gap-6 ${
                index !== 0 ? 'pt-8 md:pl-8 md:pt-0 lg:pl-12' : ''
              }`}
            >
              {/* Thumbnail 70x94 aspect ratio */}
              <div className="relative h-[94px] w-[70px] flex-shrink-0 overflow-hidden border border-line-inv bg-ink-soft">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="94px"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1">
                <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-inv">
                  {item.tag}
                </span>
                <h3 className="mt-0.5 text-xs font-bold uppercase tracking-wider text-cream sm:text-sm">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-inv">
                  {item.description}
                </p>
                <button
                  type="button"
                  onClick={handleViewPerspective}
                  className="group mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-looser text-cream transition-colors hover:text-muted-inv"
                >
                  <span>View Product</span>
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
