'use client';

import React from 'react';
import { ArrowUp, Phone, Mail, MapPin } from 'lucide-react';
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
  WhatsAppIcon,
  MessengerIcon,
} from '@/components/ui/SocialIcons';

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  whatsapp?: string;
  messenger?: string;
}

interface FooterContentProps {
  contactPhone?: string | null;
  contactEmail?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  socialLinks?: SocialLinks;
}

export function FooterContent({
  contactPhone = '+8801700000000',
  contactEmail = 'contact@gentshood.com',
  whatsapp = '+8801700000000',
  address = 'Gulshan 2, Dhaka, Bangladesh',
  socialLinks = {},
}: FooterContentProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanWaNumber = (whatsapp || '').replace(/[^\d]/g, '');

  return (
    <footer className="border-cream/15 relative mt-auto w-full overflow-hidden border-t bg-gradient-to-b from-[#141214] via-[#0d0b0d] to-[#070607] pb-12 pt-14 text-cream">
      {/* Background Giant Typographic Watermark Layer (Two Lines: GENTS / HOOD) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 flex select-none flex-col items-center justify-center overflow-hidden"
      >
        <div className="flex w-full select-none flex-col items-center justify-center text-center font-black uppercase tracking-[-0.02em]">
          <span className="select-none text-[28vw] leading-[0.76] text-white/[0.065] sm:text-[22vw] lg:text-[18vw]">
            GENTS
          </span>
          <span className="select-none text-[28vw] leading-[0.76] text-white/[0.065] sm:text-[22vw] lg:text-[18vw]">
            HOOD
          </span>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        {/* Support & Social Presence */}
        <div className="border-cream/15 flex flex-col justify-between gap-8 border-b pb-10 sm:flex-row sm:items-end">
          {/* Direct Support */}
          <div className="space-y-4">
            <h3 className="label-caps font-bold tracking-[0.25em] text-cream">Direct Support</h3>

            <div className="text-cream/80 space-y-3 text-xs">
              <p className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-cream" />
                <a
                  href={`tel:${contactPhone}`}
                  className="font-mono transition-colors hover:text-white"
                >
                  {contactPhone}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <WhatsAppIcon className="h-3.5 w-3.5 shrink-0 text-cream" />
                <a
                  href={`https://wa.me/${cleanWaNumber}?text=Hello%20Gents%20Hood`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  WhatsApp: {whatsapp}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-cream" />
                <a href={`mailto:${contactEmail}`} className="transition-colors hover:text-white">
                  {contactEmail}
                </a>
              </p>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cream" />
                <span className="text-cream/90">{address}</span>
              </p>
            </div>
          </div>

          {/* Social Presence */}
          <div className="space-y-3.5">
            <span className="text-cream/70 block text-[10px] font-bold uppercase tracking-[0.22em]">
              Follow The Hood
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-cream transition-all duration-300 hover:scale-110 hover:border-cream hover:bg-cream hover:text-[#0d0b0d] hover:shadow-[0_0_15px_rgba(255,255,243,0.2)]"
                >
                  <FacebookIcon className="h-3.5 w-3.5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Instagram"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-cream transition-all duration-300 hover:scale-110 hover:border-cream hover:bg-cream hover:text-[#0d0b0d] hover:shadow-[0_0_15px_rgba(255,255,243,0.2)]"
                >
                  <InstagramIcon className="h-3.5 w-3.5" />
                </a>
              )}
              {socialLinks.tiktok && (
                <a
                  href={socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="TikTok"
                  aria-label="TikTok"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-cream transition-all duration-300 hover:scale-110 hover:border-cream hover:bg-cream hover:text-[#0d0b0d] hover:shadow-[0_0_15px_rgba(255,255,243,0.2)]"
                >
                  <TikTokIcon className="h-3.5 w-3.5" />
                </a>
              )}
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="YouTube"
                  aria-label="YouTube"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-cream transition-all duration-300 hover:scale-110 hover:border-cream hover:bg-cream hover:text-[#0d0b0d] hover:shadow-[0_0_15px_rgba(255,255,243,0.2)]"
                >
                  <YouTubeIcon className="h-3.5 w-3.5" />
                </a>
              )}
              {socialLinks.whatsapp && (
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp"
                  aria-label="WhatsApp"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-cream transition-all duration-300 hover:scale-110 hover:border-cream hover:bg-cream hover:text-[#0d0b0d] hover:shadow-[0_0_15px_rgba(255,255,243,0.2)]"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                </a>
              )}
              {socialLinks.messenger && (
                <a
                  href={socialLinks.messenger}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Messenger"
                  aria-label="Messenger"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-cream transition-all duration-300 hover:scale-110 hover:border-cream hover:bg-cream hover:text-[#0d0b0d] hover:shadow-[0_0_15px_rgba(255,255,243,0.2)]"
                >
                  <MessengerIcon className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Back to Top */}
        <div className="text-cream/60 flex flex-col items-center justify-between gap-4 pt-6 text-[10px] uppercase tracking-widest sm:flex-row">
          <p>© {new Date().getFullYear()} GENTS HOOD ATELIER. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-6">
            <span className="text-cream/40 hidden sm:inline-block">
              Designed with precision by Tamim Labs
            </span>
            <button
              type="button"
              onClick={scrollToTop}
              className="border-cream/25 bg-cream/[0.04] group flex items-center gap-2 border px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-cream transition-all duration-300 hover:border-cream hover:bg-cream hover:text-[#0d0b0d] hover:shadow-[0_0_20px_rgba(255,255,243,0.15)] active:scale-95"
            >
              <span>Back to Top</span>
              <ArrowUp className="h-3 w-3 transition-transform duration-200 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
