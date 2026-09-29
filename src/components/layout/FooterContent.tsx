'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Truck,
  CheckCircle,
} from 'lucide-react';
import { NewsletterForm } from './NewsletterForm';

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
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cleanWaNumber = (whatsapp || '').replace(/[^\d]/g, '');

  return (
    <footer className="border-muted-inv/20 relative mt-auto w-full overflow-hidden border-t bg-ink pb-12 pt-16 text-cream selection:bg-cream selection:text-ink">
      {/* 1. Huge Architectural Typography Background Wordmark */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 select-none overflow-hidden text-center">
        <span className="text-cream/[0.04] block text-[4.5rem] font-black uppercase leading-none tracking-tighter sm:text-[7.5rem] md:text-[10rem] lg:text-[13rem]">
          GENTS HOOD
        </span>
      </div>

      <div className="relative mx-auto max-w-[1440px] space-y-16 px-6 sm:px-10 lg:px-14">
        {/* 2. Newsletter Subscription Row */}
        <div className="border-muted-inv/20 flex flex-col justify-between gap-8 border-b pb-14 lg:flex-row lg:items-center">
          <div className="max-w-xl space-y-2">
            <span className="label-caps tracking-widest text-muted-inv">
              The Hood Editorial Dispatch
            </span>
            <h2 className="heading-lg text-cream">Join the Hood</h2>
            <p className="text-xs leading-relaxed text-muted-inv">
              Subscribe to receive private capsule drops, bespoke tailoring dispatches, and private
              invitations to seasonal collection debuts.
            </p>
          </div>

          <NewsletterForm />
        </div>

        {/* 3. Link Columns (Desktop Grid / Mobile Accordion) */}
        <div className="border-muted-inv/20 grid grid-cols-1 gap-8 border-b pb-14 text-xs md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Shop */}
          <div className="border-muted-inv/10 border-b pb-4 md:border-none md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection('shop')}
              className="flex w-full items-center justify-between py-2 text-left md:pointer-events-none md:py-0"
            >
              <h3 className="label-caps font-bold text-cream">Shop Collection</h3>
              <ChevronDown
                className={`h-4 w-4 text-muted-inv transition-transform md:hidden ${
                  openSection === 'shop' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`mt-4 space-y-3 text-muted-inv ${
                openSection === 'shop' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link href="/trending" className="transition-colors hover:text-cream">
                  Best of Gents Hood (Trending)
                </Link>
              </li>
              <li>
                <Link href="/" className="transition-colors hover:text-cream">
                  Flagship Overcoat Collection
                </Link>
              </li>
              <li>
                <Link href="/trending" className="transition-colors hover:text-cream">
                  Relaxed Fleece & Hoodies
                </Link>
              </li>
              <li>
                <Link href="/trending" className="transition-colors hover:text-cream">
                  Architectural Jackets & Blazers
                </Link>
              </li>
              <li>
                <Link href="/trending" className="transition-colors hover:text-cream">
                  Tailored Trousers & Cargos
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Assistance */}
          <div className="border-muted-inv/10 border-b pb-4 md:border-none md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection('help')}
              className="flex w-full items-center justify-between py-2 text-left md:pointer-events-none md:py-0"
            >
              <h3 className="label-caps font-bold text-cream">Customer Assistance</h3>
              <ChevronDown
                className={`h-4 w-4 text-muted-inv transition-transform md:hidden ${
                  openSection === 'help' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`mt-4 space-y-3 text-muted-inv ${
                openSection === 'help' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link href="/track-order" className="transition-colors hover:text-cream">
                  Track Your Shipment
                </Link>
              </li>
              <li>
                <Link href="/account" className="transition-colors hover:text-cream">
                  Customer Portal & Order History
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Direct WhatsApp Concierge
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Exchange & Return Policy (7 Days)
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Atelier Sizing Guide & Fit Advice
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: The Atelier */}
          <div className="border-muted-inv/10 border-b pb-4 md:border-none md:pb-0">
            <button
              type="button"
              onClick={() => toggleSection('atelier')}
              className="flex w-full items-center justify-between py-2 text-left md:pointer-events-none md:py-0"
            >
              <h3 className="label-caps font-bold text-cream">The Atelier</h3>
              <ChevronDown
                className={`h-4 w-4 text-muted-inv transition-transform md:hidden ${
                  openSection === 'atelier' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`mt-4 space-y-3 text-muted-inv ${
                openSection === 'atelier' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Studio Showroom in Gulshan 2
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Craftsmanship & Fabric Standards
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Privacy Policy & Data Security
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-cream">
                  Terms & Conditions of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="text-[10px] uppercase transition-colors hover:text-cream"
                >
                  Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Social Presence */}
          <div className="space-y-4">
            <h3 className="label-caps font-bold text-cream">Direct Support</h3>

            <div className="space-y-2.5 text-xs text-muted-inv">
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0 text-cream" />
                <a
                  href={`tel:${contactPhone}`}
                  className="font-mono transition-colors hover:text-cream"
                >
                  {contactPhone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-cream" />
                <a
                  href={`https://wa.me/${cleanWaNumber}?text=Hello%20Gents%20Hood`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-cream"
                >
                  WhatsApp: {whatsapp}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0 text-cream" />
                <a href={`mailto:${contactEmail}`} className="transition-colors hover:text-cream">
                  {contactEmail}
                </a>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cream" />
                <span>{address}</span>
              </p>
            </div>

            {/* Social Icons dynamically populated from SiteSetting */}
            <div className="pt-2">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-inv">
                Follow The Hood
              </span>
              <div className="flex flex-wrap items-center gap-3">
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook"
                    className="bg-cream/10 flex h-8 w-8 items-center justify-center rounded-full text-cream transition-all hover:scale-110 hover:bg-cream hover:text-ink"
                  >
                    <span className="font-mono text-xs font-bold">fb</span>
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Instagram"
                    className="bg-cream/10 flex h-8 w-8 items-center justify-center rounded-full text-cream transition-all hover:scale-110 hover:bg-cream hover:text-ink"
                  >
                    <span className="font-mono text-xs font-bold">ig</span>
                  </a>
                )}
                {socialLinks.tiktok && (
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="TikTok"
                    className="bg-cream/10 flex h-8 w-8 items-center justify-center rounded-full text-cream transition-all hover:scale-110 hover:bg-cream hover:text-ink"
                  >
                    <span className="font-mono text-xs font-bold">tk</span>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="YouTube"
                    className="bg-cream/10 flex h-8 w-8 items-center justify-center rounded-full text-cream transition-all hover:scale-110 hover:bg-cream hover:text-ink"
                  >
                    <span className="font-mono text-xs font-bold">yt</span>
                  </a>
                )}
                {socialLinks.whatsapp && (
                  <a
                    href={socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp"
                    className="bg-cream/10 flex h-8 w-8 items-center justify-center rounded-full text-cream transition-all hover:scale-110 hover:bg-cream hover:text-ink"
                  >
                    <span className="font-mono text-xs font-bold">wa</span>
                  </a>
                )}
                {socialLinks.messenger && (
                  <a
                    href={socialLinks.messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Messenger"
                    className="bg-cream/10 flex h-8 w-8 items-center justify-center rounded-full text-cream transition-all hover:scale-110 hover:bg-cream hover:text-ink"
                  >
                    <span className="font-mono text-xs font-bold">ms</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Payment Badges & COD Assurance */}
        <div className="border-muted-inv/20 flex flex-wrap items-center justify-between gap-6 border-b pb-8 text-[11px] text-muted-inv">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-cream" />
              Cash on Delivery Available
            </span>
            <span className="flex items-center gap-2 font-medium">
              <Truck className="h-4 w-4 text-cream" />
              Dhaka 48h / Nationwide Delivery
            </span>
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle className="h-4 w-4 text-cream" />
              Authentic Premium Fabrics
            </span>
          </div>

          <div className="text-[10px] uppercase tracking-wider">
            Crafted for Uncompromised Modern Menswear
          </div>
        </div>

        {/* 5. Bottom Copyright & Back to Top */}
        <div className="flex flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-muted-inv sm:flex-row">
          <p>© {new Date().getFullYear()} GENTS HOOD ATELIER. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline-block">Designed with precision by Tamim Labs</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="border-muted-inv/30 flex items-center gap-1.5 border px-3 py-1.5 text-cream transition-colors hover:border-cream hover:text-cream"
            >
              <span>Back to Top</span>
              <ArrowUp className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
