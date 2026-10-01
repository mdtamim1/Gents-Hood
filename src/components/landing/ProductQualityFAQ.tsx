'use client';

import React, { useState } from 'react';

export interface FAQItem {
  id: string;
  number: string;
  badge: string;
  question: string;
  answer: string;
  highlights: string[];
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    number: '01',
    badge: 'Fabric & Durability',
    question: 'How is the fabric quality, and will it shrink or lose color after washing?',
    answer:
      'Every Gents Hood garment is crafted from 100% premium combed heavyweight cotton and bespoke milled twill. Fabrics undergo advanced pre-shrinking and reactive yarn dyeing, ensuring the garment retains its precise fit, structure, and rich deep color wash after wash.',
    highlights: [
      '100% Pre-Shrunk Fabric',
      'Zero Color Bleed Guarantee',
      'Long-Lasting Drape & Structure',
    ],
  },
  {
    id: 'faq-2',
    number: '02',
    badge: 'Photo vs Reality',
    question: 'Will the actual product look identical to the pictures and videos?',
    answer:
      'Yes, 100% identical. We never use generic internet stock photos. Every photo and video is shot in-house in our studio with the actual production piece, without deceptive color filters, showcasing true-to-life texture, stitch detailing, and authentic drape.',
    highlights: [
      'In-House Studio Photography',
      'Zero Deceptive Filters',
      '100% True-to-Life Product',
    ],
  },
  {
    id: 'faq-3',
    number: '03',
    badge: 'Inspection & Returns',
    question: 'Can I inspect and verify the product upon delivery before making payment?',
    answer:
      'Absolutely. Our delivery courier allows open-box inspection at your doorstep. You can check the fabric, stitching, and size to ensure 100% satisfaction before paying via Cash on Delivery. If you are not completely satisfied, you can return it on the spot free of charge.',
    highlights: [
      'On-the-Spot Open Box Check',
      'Cash On Delivery Available',
      'Hassle-Free Instant Return',
    ],
  },
];

interface ProductQualityFAQProps {
  faqsJson?: string | null;
}

export function ProductQualityFAQ({ faqsJson }: ProductQualityFAQProps = {}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const faqs = React.useMemo<FAQItem[]>(() => {
    if (faqsJson) {
      try {
        const parsed = JSON.parse(faqsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return FAQ_ITEMS;
  }, [faqsJson]);

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      aria-label="Product Quality & Trust FAQ"
      className="w-full border-b border-line bg-cream py-10 sm:py-16"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-14">
        {/* Section Header (Clean luxury typography without clunky subtitles) */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-2.5 inline-flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#4A0E17] sm:w-14" />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.35em] text-[#4A0E17] sm:text-xs">
              ◆ TRANSPARENCY &amp; QUALITY ASSURANCE ◆
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#4A0E17] sm:w-14" />
          </div>
          <h2
            className="text-2xl font-black uppercase tracking-tight text-ink sm:text-4xl lg:text-5xl"
            style={{ fontVariant: 'small-caps', letterSpacing: '0.04em' }}
          >
            Frequently Asked Questions
          </h2>
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <span className="bg-ink/15 h-px w-12" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[#4A0E17]" />
            <span className="bg-ink/15 h-px w-12" />
          </div>
        </div>

        {/* FAQ Accordion Cards */}
        <div className="mx-auto max-w-3xl space-y-3.5 sm:space-y-4">
          {faqs.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="duration-400 overflow-hidden transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  border: isOpen ? '1.5px solid #4A0E17' : '1px solid rgba(0,0,0,0.10)',
                  background: isOpen ? '#ffffff' : 'rgba(255,255,255,0.7)',
                  boxShadow: isOpen
                    ? '0 12px 32px rgba(74,14,23,0.10), 0 2px 8px rgba(0,0,0,0.04)'
                    : '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                {/* Accordion Toggle Header */}
                <button
                  type="button"
                  onClick={() => toggleFAQ(item.id)}
                  aria-expanded={isOpen}
                  className="hover:bg-ink/[0.015] flex w-full items-start justify-between gap-3 p-4 text-left transition-colors sm:items-center sm:gap-4 sm:p-5"
                >
                  <div className="flex flex-1 items-start gap-3 sm:items-center sm:gap-4">
                    {/* Number Badge */}
                    <span
                      className="shrink-0 px-2 py-1 font-mono text-xs font-black text-white transition-colors duration-300 sm:text-sm"
                      style={{
                        background: isOpen
                          ? 'linear-gradient(135deg, #2a0a10, #4A0E17)'
                          : 'rgba(26,26,26,0.75)',
                      }}
                    >
                      {item.number}
                    </span>

                    <div className="space-y-1">
                      <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#4A0E17]/80">
                        {item.badge}
                      </span>
                      <h3 className="text-sm font-bold leading-snug text-ink sm:text-base">
                        {item.question}
                      </h3>
                    </div>
                  </div>

                  {/* Toggle Chevron */}
                  <div
                    className="duration-400 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      borderColor: isOpen ? '#4A0E17' : 'rgba(0,0,0,0.15)',
                      background: isOpen ? 'rgba(74,14,23,0.08)' : 'transparent',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-ink/70 h-3.5 w-3.5"
                    >
                      <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* Collapsible Answer Body with Silky Smooth Grid & Transform Animation */}
                <div
                  className={`duration-400 grid transition-[grid-template-rows,opacity] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'pointer-events-none grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`border-line/50 duration-400 transform border-t px-4 pb-5 pt-1 transition-transform ease-[cubic-bezier(0.16,1,0.3,1)] sm:px-5 sm:pb-6 ${
                        isOpen ? 'translate-y-0' : '-translate-y-2'
                      }`}
                    >
                      <p className="text-ink/75 text-xs font-normal leading-[1.8] sm:text-[13px]">
                        {item.answer}
                      </p>

                      {/* Quality Highlights Tags */}
                      <div className="border-ink/5 mt-4 flex flex-wrap gap-2 border-t pt-3.5">
                        {item.highlights.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1.5 border border-[#4A0E17]/15 bg-[#4A0E17]/[0.06] px-2.5 py-1 text-[10px] font-bold text-[#4A0E17]"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3 w-3 text-[#4A0E17]"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
