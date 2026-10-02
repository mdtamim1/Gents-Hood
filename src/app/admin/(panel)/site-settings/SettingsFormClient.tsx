'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Save,
  Phone,
  Truck,
  Share2,
  Images,
  Trash2,
  Plus,
  HelpCircle,
  Upload,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Flame,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export interface GalleryStripItem {
  id?: string;
  title: string;
  image: string;
}

export interface FAQItemData {
  id: string;
  number: string;
  badge: string;
  question: string;
  answer: string;
  highlights: string[];
}

export interface AnnouncementItemData {
  id: string;
  text: string;
  link?: string;
  icon?: string;
}

const DEFAULT_GALLERY_STRIP: GalleryStripItem[] = [
  { id: '1', title: 'Front View', image: '/images/gallery-front.jpg' },
  { id: '2', title: 'Texture & Detail', image: '/images/gallery-detail.jpg' },
  { id: '3', title: 'Silhouette Fit', image: '/images/gallery-lifestyle.jpg' },
];

const DEFAULT_FAQS: FAQItemData[] = [
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

const DEFAULT_ANNOUNCEMENTS: AnnouncementItemData[] = [
  {
    id: '1',
    text: 'FREE EXPRESS SHIPPING ACROSS BANGLADESH ON ORDERS OVER ৳3,000',
    link: '/trending',
    icon: '✦',
  },
  {
    id: '2',
    text: 'CASH ON DELIVERY AVAILABLE NATIONWIDE · 100% SECURE & EASY RETURNS',
    link: '/trending',
    icon: '⚡',
  },
  {
    id: '3',
    text: 'NEW SIGNATURE LUXURY COLLECTION IS LIVE NOW · LIMITED QUANTITY DROPS',
    link: '/trending',
    icon: '◆',
  },
  {
    id: '4',
    text: 'GET 10% OFF ON YOUR FIRST ORDER — USE VOUCHER CODE: GENTS10',
    link: '/trending',
    icon: '✦',
  },
  {
    id: '5',
    text: 'PREMIUM COMBED HEAVYWEIGHT COTTON & BESPOKE TAILORED DRAPE',
    link: '/trending',
    icon: '★',
  },
];

interface SiteSettingData {
  announcementText?: string | null;
  announcementsJson?: string | null;
  freeDeliveryMin?: number | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  heroTagline?: string | null;
  heroBackgroundWord?: string | null;
  deliveryCharges?: string | null;
  socialLinks?: string | null;
  galleryStripJson?: string | null;
  trendingBannerJson?: string | null;
  trendingMarqueeText?: string | null;
  manifestoLine1?: string | null;
  manifestoLine2?: string | null;
  faqJson?: string | null;
}

type TabType = 'shipping' | 'marquees' | 'banners' | 'faqs';

export function SettingsFormClient({ initialSettings }: { initialSettings: SiteSettingData }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('marquees');
  const [isSaving, setIsSaving] = useState(false);

  // Delivery charges parsing
  let parsedCharges = { insideDhaka: 70, outsideDhaka: 130 };
  if (initialSettings.deliveryCharges) {
    try {
      parsedCharges = JSON.parse(initialSettings.deliveryCharges);
    } catch {
      // ignore
    }
  }

  // Social links parsing
  let parsedSocial = {
    facebook: 'https://facebook.com/gentshood',
    instagram: 'https://instagram.com/gentshood',
    tiktok: 'https://tiktok.com/@gentshood',
    youtube: 'https://youtube.com/@gentshood',
    whatsapp: 'https://wa.me/8801700000000',
    messenger: 'https://m.me/gentshood',
  };
  if (initialSettings.socialLinks) {
    try {
      parsedSocial = { ...parsedSocial, ...JSON.parse(initialSettings.socialLinks) };
    } catch {
      // ignore
    }
  }

  // Gallery Strip parsing
  let parsedGallery: GalleryStripItem[] = DEFAULT_GALLERY_STRIP;
  if (initialSettings.galleryStripJson) {
    try {
      const parsed = JSON.parse(initialSettings.galleryStripJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedGallery = parsed;
      }
    } catch {
      // ignore
    }
  }

  // Trending Banner parsing
  let parsedTrendingBanner = {
    mediaType: 'image' as 'image' | 'video',
    imageUrl: '/images/trending-banner.jpg',
    videoUrl: '',
    linkUrl: '/trending',
    buttonText: 'Explore Collection',
  };
  if (initialSettings.trendingBannerJson) {
    try {
      const parsed = JSON.parse(initialSettings.trendingBannerJson);
      parsedTrendingBanner = { ...parsedTrendingBanner, ...parsed };
    } catch {
      // ignore
    }
  }

  // FAQs parsing
  let parsedFaqs: FAQItemData[] = DEFAULT_FAQS;
  if (initialSettings.faqJson) {
    try {
      const parsed = JSON.parse(initialSettings.faqJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedFaqs = parsed;
      }
    } catch {
      // ignore
    }
  }

  // Announcements parsing
  let parsedAnnouncements: AnnouncementItemData[] = DEFAULT_ANNOUNCEMENTS;
  if (initialSettings.announcementsJson) {
    try {
      const parsed = JSON.parse(initialSettings.announcementsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedAnnouncements = parsed;
      }
    } catch {
      // ignore
    }
  } else if (initialSettings.announcementText) {
    const parts = initialSettings.announcementText
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      parsedAnnouncements = parts.map((t, i) => ({
        id: String(i + 1),
        text: t,
        link: '/trending',
        icon: '✦',
      }));
    }
  }

  const [form, setForm] = useState({
    // Store & Shipping
    freeDeliveryMin: initialSettings.freeDeliveryMin ?? 3000,
    insideDhaka: parsedCharges.insideDhaka || 70,
    outsideDhaka: parsedCharges.outsideDhaka || 130,
    contactPhone: initialSettings.contactPhone || '+8801700000000',
    contactEmail: initialSettings.contactEmail || 'contact@gentshood.com',
    whatsapp: initialSettings.whatsapp || '+8801700000000',
    address: initialSettings.address || 'Gulshan 2, Dhaka, Bangladesh',
    facebook: parsedSocial.facebook || '',
    instagram: parsedSocial.instagram || '',
    tiktok: parsedSocial.tiktok || '',
    youtube: parsedSocial.youtube || '',
    whatsappLink: parsedSocial.whatsapp || '',
    messenger: parsedSocial.messenger || '',

    // Hero Branding
    heroTagline: initialSettings.heroTagline || 'Fashion That Moves With You',
    heroBackgroundWord: initialSettings.heroBackgroundWord || 'GENTS HOOD',

    // Task 4: Announcement Bar
    announcements: parsedAnnouncements,
    announcementText:
      initialSettings.announcementText || parsedAnnouncements.map((a) => a.text).join(' | '),

    // Task 1: Trending Marquee Ticker
    trendingMarqueeText:
      initialSettings.trendingMarqueeText ||
      'BEST OF GENTS HOOD • PREMIUM COLLECTIONS • 100% COMBED COTTON • BESPOKE TAILORED DRAPE',

    // Task 2: Style Manifesto Dual-Line Marquee
    manifestoLine1: initialSettings.manifestoLine1 || 'Signature Style for Modern Men.',
    manifestoLine2: initialSettings.manifestoLine2 || 'Everyday Style, Made Exceptional.',

    // Task 5: Gallery Strip & Trending Banner
    galleryStrip: parsedGallery,
    trendingBannerMediaType: parsedTrendingBanner.mediaType || 'image',
    trendingBannerImageUrl: parsedTrendingBanner.imageUrl || '/images/trending-banner.jpg',
    trendingBannerVideoUrl: parsedTrendingBanner.videoUrl || '',
    trendingBannerLinkUrl: parsedTrendingBanner.linkUrl || '/trending',
    trendingBannerButtonText: parsedTrendingBanner.buttonText || 'Explore Collection',

    // Task 3: FAQs
    faqs: parsedFaqs,
  });

  // Track upload states
  const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState<number | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  const handlePingSearchEngines = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/admin/indexing/ping', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to ping search engines');
      }
      showToast(
        `⚡ Instant indexing signal sent to search engines for ${data.urls?.length || 0} pages!`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to ping search engines';
      showToast(msg, 'danger');
    } finally {
      setIsPinging(false);
    }
  };

  // File upload handler for Sharp WebP compression
  const uploadImageFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data.url;
  };

  const handleGalleryUpload = async (file: File, idx: number) => {
    setUploadingGalleryIdx(idx);
    try {
      const url = await uploadImageFile(file);
      const updated = [...form.galleryStrip];
      updated[idx] = { ...updated[idx], image: url };
      setForm((prev) => ({ ...prev, galleryStrip: updated }));
      showToast('Image uploaded and auto-optimized to crisp WebP!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg, 'danger');
    } finally {
      setUploadingGalleryIdx(null);
    }
  };

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    try {
      const url = await uploadImageFile(file);
      setForm((prev) => ({ ...prev, trendingBannerImageUrl: url }));
      showToast('Banner image uploaded and auto-converted to high-res WebP!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg, 'danger');
    } finally {
      setUploadingBanner(false);
    }
  };

  // Submit all settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Sync announcementText with current announcements list
      const combinedAnnouncementText =
        form.announcements.length > 0
          ? form.announcements.map((a) => a.text).join(' | ')
          : form.announcementText;

      const payload = {
        announcementText: combinedAnnouncementText,
        announcementsJson: JSON.stringify(form.announcements),
        freeDeliveryMin: Number(form.freeDeliveryMin),
        deliveryCharges: {
          insideDhaka: Number(form.insideDhaka),
          outsideDhaka: Number(form.outsideDhaka),
        },
        contactPhone: form.contactPhone,
        contactEmail: form.contactEmail,
        whatsapp: form.whatsapp,
        address: form.address,
        heroTagline: form.heroTagline,
        heroBackgroundWord: form.heroBackgroundWord,
        socialLinks: {
          facebook: form.facebook,
          instagram: form.instagram,
          tiktok: form.tiktok,
          youtube: form.youtube,
          whatsapp: form.whatsappLink,
          messenger: form.messenger,
        },
        galleryStrip: form.galleryStrip,
        trendingBanner: {
          mediaType: form.trendingBannerMediaType,
          imageUrl: form.trendingBannerImageUrl,
          videoUrl: form.trendingBannerVideoUrl,
          linkUrl: form.trendingBannerLinkUrl,
          buttonText: form.trendingBannerButtonText,
        },
        trendingMarqueeText: form.trendingMarqueeText,
        manifestoLine1: form.manifestoLine1,
        manifestoLine2: form.manifestoLine2,
        faqJson: JSON.stringify(form.faqs),
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }

      showToast(
        'All site & storefront settings saved successfully! Live storefront caches refreshed.',
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving settings';
      showToast(msg, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      {/* ─── Top Bar / Header ─── */}
      <div className="sticky top-0 z-30 -mx-6 -mt-6 border-b border-white/[0.08] bg-[#0E0E10]/95 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
                Admin Console
              </span>
              <span className="text-white/20">/</span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                Site & Atelier Control
              </span>
            </div>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
              Site & Storefront Settings
            </h1>
            <p className="mt-0.5 text-xs text-white/50">
              Customize marquees, announcement headlines, FAQ cards, gallery media, and shipping
              thresholds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isPinging}
              onClick={handlePingSearchEngines}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50"
              title="Ping Google & IndexNow search engines for all active site URLs"
            >
              <Zap className={`h-3.5 w-3.5 text-emerald-400 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging Search Engines...' : '⚡ Ping Search Engines'}</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View Store</span>
            </Link>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#800020] via-[#5C0612] to-[#800020] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(128,0,32,0.35)] transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>

        {/* ─── Navigation Tabs ─── */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('marquees')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'marquees'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-[#e50914]" />
            <span>1. Marquees & Announcements</span>
            <span className="py-0.2 rounded-full bg-[#e50914]/20 px-1.5 font-mono text-[9px] text-[#ff7070]">
              Tasks 1, 2, 4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'banners'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <Images className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>2. Banners & Gallery Media</span>
            <span className="py-0.2 rounded-full bg-[#D4AF37]/20 px-1.5 font-mono text-[9px] text-[#f7e089]">
              Task 5
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'faqs'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>3. Frequently Asked Questions</span>
            <span className="py-0.2 rounded-full bg-emerald-500/20 px-1.5 font-mono text-[9px] text-emerald-300">
              Task 3
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'shipping'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20'
                : 'text-white/50 hover:bg-white/5 hover:text-white/80'
            }`}
          >
            <Truck className="h-3.5 w-3.5 text-sky-400" />
            <span>4. Store & Shipping</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: MARQUEES & ANNOUNCEMENTS (Tasks 1, 2, 4)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'marquees' && (
        <div className="space-y-6">
          {/* ── Task 4 (Image 4): Announcement Bar Manager ── */}
          <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
            <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded bg-[#4A0E17] px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#ff99a8]">
                    Image 4 • Task 4
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Top Announcement Bar (হেডার অ্যানাউন্সমেন্ট)
                  </h2>
                </div>
                <p className="mt-1 text-xs text-white/50">
                  ওয়েবসাইটের একদম উপরে যে লাল স্ট্রিপে স্লাইড হতে থাকে, সেই টেক্সটগুলো এখান থেকে
                  পরিবর্তন ও যোগ করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newId = String(Date.now());
                  setForm({
                    ...form,
                    announcements: [
                      ...form.announcements,
                      {
                        id: newId,
                        text: 'NEW SPECIAL PROMOTION — LIMITED TIME DROP',
                        link: '/trending',
                        icon: '✦',
                      },
                    ],
                  });
                }}
                className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
              >
                <Plus className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Add Announcement Item</span>
              </button>
            </div>

            {/* Announcement Items List */}
            <div className="mt-5 space-y-3">
              {form.announcements.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="group relative flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-[#0E0E10] p-4 transition-all hover:border-white/15 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2 sm:w-20">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 font-mono text-xs font-bold text-white/60">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.icon || '✦'}
                      maxLength={2}
                      onChange={(e) => {
                        const updated = [...form.announcements];
                        updated[idx] = { ...updated[idx], icon: e.target.value };
                        setForm({ ...form, announcements: updated });
                      }}
                      title="Icon symbol (e.g. ✦, ⚡, ★)"
                      className="w-9 rounded-md border border-white/10 bg-white/5 py-1 text-center font-mono text-xs text-[#D4AF37] focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                      Announcement Message #{idx + 1}
                    </label>
                    <input
                      type="text"
                      required
                      value={item.text}
                      onChange={(e) => {
                        const updated = [...form.announcements];
                        updated[idx] = { ...updated[idx], text: e.target.value };
                        setForm({ ...form, announcements: updated });
                      }}
                      placeholder="e.g. FREE EXPRESS SHIPPING ACROSS BANGLADESH ON ORDERS OVER ৳3,000"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-wide text-white placeholder:text-white/20 focus:border-[#800020] focus:outline-none focus:ring-1 focus:ring-[#800020]"
                    />
                  </div>

                  <div className="sm:w-44">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                      Target Link
                    </label>
                    <input
                      type="text"
                      value={item.link || '/trending'}
                      onChange={(e) => {
                        const updated = [...form.announcements];
                        updated[idx] = { ...updated[idx], link: e.target.value };
                        setForm({ ...form, announcements: updated });
                      }}
                      placeholder="/trending"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white/70 placeholder:text-white/20 focus:border-[#800020] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-1 sm:pt-4">
                    {form.announcements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.announcements.filter((_, i) => i !== idx);
                          setForm({ ...form, announcements: updated });
                        }}
                        className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-red-500/20 hover:text-red-400"
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Presets for Announcement */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] font-medium text-white/40">Quick Inserts:</span>
              {[
                'FREE DELIVERY OVER ৳3,000',
                'CASH ON DELIVERY AVAILABLE',
                'EASY 7-DAY EXCHANGE & RETURN',
                'LIMITED EDITION COLLECTION LIVE',
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      announcements: [
                        ...form.announcements,
                        {
                          id: String(Date.now()),
                          text: preset,
                          link: '/trending',
                          icon: '✦',
                        },
                      ],
                    });
                  }}
                  className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/70 hover:border-white/20 hover:bg-white/10"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {/* Live Ticker Preview */}
            <div className="mt-5 rounded-lg border border-white/[0.08] bg-[#0E0E10] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Live Marquee Preview (লাইভ প্রিভিউ)
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400" />
                  Infinite Ticker Active
                </span>
              </div>
              <div className="relative overflow-hidden rounded bg-[#1c0509] py-2 text-white">
                <div
                  className="animate-marquee-ticker flex whitespace-nowrap"
                  style={{ animationDuration: '20s' }}
                >
                  {form.announcements.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 px-6">
                      <span className="text-[#D4AF37]">{a.icon || '✦'}</span>
                      <span className="font-mono text-[11px] font-bold tracking-wider">
                        {a.text}
                      </span>
                    </div>
                  ))}
                  {/* duplicate for seamless loop */}
                  {form.announcements.map((a, i) => (
                    <div key={`d-${i}`} className="flex items-center gap-3 px-6">
                      <span className="text-[#D4AF37]">{a.icon || '✦'}</span>
                      <span className="font-mono text-[11px] font-bold tracking-wider">
                        {a.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Task 1 (Image 2): Trending Section Marquee Ticker ── */}
          <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
            <div className="border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 items-center rounded bg-[#e50914]/20 px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#ff858d]">
                  Image 2 • Task 1
                </span>
                <h2 className="text-base font-bold text-white">
                  Trending Section HUD Ticker (হোমপেইজ ব্যানার নিচের লাল স্ক্রল টেক্সট)
                </h2>
              </div>
              <p className="mt-1 text-xs text-white/50">
                হোমপেইজের Trending Collection ব্যানারের নিচে লাল ডট সহ যে রানিং স্ক্রল টেক্সটটি চলে,
                সেটি নিজের ইচ্ছামতো পরিবর্তন করুন। শব্দগুলো &quot;•&quot; বা &quot;|&quot; দিয়ে
                আলাদা করুন।
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/80">
                  Ticker Marquee Text (স্ক্রল টেক্সট)
                </label>
                <input
                  type="text"
                  required
                  value={form.trendingMarqueeText}
                  onChange={(e) => setForm({ ...form, trendingMarqueeText: e.target.value })}
                  placeholder="BEST OF GENTS HOOD • PREMIUM COLLECTIONS • 100% COMBED COTTON"
                  className="w-full rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white placeholder:text-white/20 focus:border-[#e50914] focus:outline-none focus:ring-1 focus:ring-[#e50914]"
                />
                <p className="mt-1.5 text-[11px] text-white/40">
                  টিপ: প্রতিটি আইটেমের মাঝে <code className="text-[#D4AF37]">•</code> অথবা{' '}
                  <code className="text-[#D4AF37]">|</code> চিহ্ন দিন। প্রতিটি আইটেমের আগে
                  স্বয়ংক্রিয়ভাবে লাল ডট ও শেষে স্ল্যাশ প্রদর্শিত হবে।
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-white/40">Presets:</span>
                {[
                  'BEST OF GENTS HOOD • PREMIUM COLLECTIONS',
                  '100% COMBED COTTON • BESPOKE TAILORED DRAPE • ZERO SHRINKAGE',
                  'LIMITED EDITION ATELIER PIECES • DHAKA BANGLADESH • SIGNATURE FIT',
                ].map((presetText) => (
                  <button
                    key={presetText}
                    type="button"
                    onClick={() => setForm({ ...form, trendingMarqueeText: presetText })}
                    className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/70 hover:border-white/20 hover:bg-white/10"
                  >
                    Use: {presetText.split('•')[0]}...
                  </button>
                ))}
              </div>

              {/* Live Preview */}
              <div className="rounded-lg border border-white/[0.08] bg-[#0E0E10] p-4">
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Live Preview: Trending Marquee Bar
                </span>
                <div
                  className="relative flex h-[34px] w-full select-none items-center overflow-hidden rounded"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(13,2,4,0.94) 0%, rgba(28,5,9,0.98) 50%, rgba(13,2,4,0.94) 100%)',
                    borderTop: '1px solid rgba(229,9,20,0.3)',
                    borderBottom: '1px solid rgba(229,9,20,0.3)',
                  }}
                >
                  <div
                    className="animate-marquee-ticker flex items-center whitespace-nowrap"
                    style={{ animationDuration: '14s' }}
                  >
                    {form.trendingMarqueeText
                      .split(/[|•]/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((text, idx) => (
                        <div key={`prev1-${idx}`} className="flex items-center gap-2.5 px-6">
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#e50914] shadow-[0_0_8px_rgba(229,9,20,0.9)]" />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/90">
                            {text}
                          </span>
                          <span className="ml-5 select-none font-mono text-[10px] text-white/20">
                            /
                          </span>
                        </div>
                      ))}
                    {form.trendingMarqueeText
                      .split(/[|•]/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((text, idx) => (
                        <div key={`prev2-${idx}`} className="flex items-center gap-2.5 px-6">
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#e50914] shadow-[0_0_8px_rgba(229,9,20,0.9)]" />
                          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-white/90">
                            {text}
                          </span>
                          <span className="ml-5 select-none font-mono text-[10px] text-white/20">
                            /
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Task 2 (Image 3): Footer Style Manifesto Dual Marquee ── */}
          <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
            <div className="border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 items-center rounded bg-[#D4AF37]/20 px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#fce494]">
                  Image 3 • Task 2
                </span>
                <h2 className="text-base font-bold text-white">
                  Footer Style Manifesto (ওয়েবসাইটের নিচের ২ লাইনের লাক্সারি মার্কি টেক্সট)
                </h2>
              </div>
              <p className="mt-1 text-xs text-white/50">
                FAQ সেকশনের ঠিক নিচে ও ফুটারে চলমান ২ লাইনের বিশাল স্টাইল ম্যানিফেস্টো টেক্সট
                কাস্টমাইজ করুন।
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/80">
                  Line 1 (প্রথম লাইন - বামে স্লাইড হয়)
                </label>
                <input
                  type="text"
                  required
                  value={form.manifestoLine1}
                  onChange={(e) => setForm({ ...form, manifestoLine1: e.target.value })}
                  placeholder="Signature Style for Modern Men."
                  className="w-full rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-2.5 font-serif text-xs tracking-wider text-white placeholder:text-white/20 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="mt-1 text-[11px] text-white/40">
                  ডিফল্ট: &quot;Signature Style for Modern Men.&quot;
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/80">
                  Line 2 (দ্বিতীয় লাইন - ডানে স্লাইড হয়)
                </label>
                <input
                  type="text"
                  required
                  value={form.manifestoLine2}
                  onChange={(e) => setForm({ ...form, manifestoLine2: e.target.value })}
                  placeholder="Everyday Style, Made Exceptional."
                  className="w-full rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-2.5 font-serif text-xs tracking-wider text-white placeholder:text-white/20 focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="mt-1 text-[11px] text-white/40">
                  ডিফল্ট: &quot;Everyday Style, Made Exceptional.&quot;
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-white/40">Preset Pairs:</span>
              {[
                { l1: 'Signature Style for Modern Men.', l2: 'Everyday Style, Made Exceptional.' },
                { l1: 'Bespoke Streetwear Atelier.', l2: 'Crafted For Distinction & Comfort.' },
                { l1: 'Understated Elegance.', l2: 'Defined by Structure, Driven by Passion.' },
              ].map((pair, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, manifestoLine1: pair.l1, manifestoLine2: pair.l2 })
                  }
                  className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/70 hover:border-white/20 hover:bg-white/10"
                >
                  Pair #{idx + 1}: &quot;{pair.l1.slice(0, 15)}...&quot;
                </button>
              ))}
            </div>

            {/* Live Editorial Preview */}
            <div className="mt-5 rounded-lg border border-white/[0.08] bg-[#0A0708] p-5">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-white/40">
                Live Editorial Preview
              </span>
              <div className="space-y-2 overflow-hidden py-3 font-serif">
                <div className="animate-marquee-ticker flex whitespace-nowrap text-lg font-normal uppercase tracking-[0.2em] sm:text-2xl">
                  <span className="text-white/90">{form.manifestoLine1}</span>
                  <span className="mx-6 text-[#D4AF37]/50">✦</span>
                  <span className="text-white/90">{form.manifestoLine1}</span>
                  <span className="mx-6 text-[#D4AF37]/50">✦</span>
                  <span className="text-white/90">{form.manifestoLine1}</span>
                </div>
                <div
                  className="animate-marquee-ticker flex whitespace-nowrap text-lg font-normal uppercase tracking-[0.2em] sm:text-2xl"
                  style={{ animationDirection: 'reverse' }}
                >
                  <span className="text-[#c8a97e]">{form.manifestoLine2}</span>
                  <span className="mx-6 text-[#D4AF37]/50">✦</span>
                  <span className="text-[#c8a97e]">{form.manifestoLine2}</span>
                  <span className="mx-6 text-[#D4AF37]/50">✦</span>
                  <span className="text-[#c8a97e]">{form.manifestoLine2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: BANNERS & GALLERY MEDIA (Task 5)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          {/* ── Task 5: Trending Collection Banner with Direct WebP Upload ── */}
          <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
            <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded bg-[#D4AF37]/20 px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#fce494]">
                    Image 5 • Task 5
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Trending Collection Banner (হোমপেইজ ব্যানার ও ছবি আপলোড)
                  </h2>
                </div>
                <p className="mt-1 text-xs text-white/50">
                  হোমপেইজের &quot;BEST OF GENTS HOOD&quot; সেকশনের মূল ব্যানার। সরাসরি নিজের
                  কম্পিউটার থেকে যেকোনো ছবি আপলোড করতে পারবেন — ছবি স্বয়ংক্রিয়ভাবে ক্রিস্টাল-ক্লিয়ার
                  WebP ফরম্যাটে অপ্টিমাইজ হয়ে যাবে (কোনো ঘোলা হবে না)।
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-mono text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                ✓ Auto-WebP (Quality 85, Max 1920px)
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                {/* Media Type Selector */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-white/80">
                    Media Type
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10">
                      <input
                        type="radio"
                        name="trendingBannerMediaType"
                        value="image"
                        checked={form.trendingBannerMediaType === 'image'}
                        onChange={() => setForm({ ...form, trendingBannerMediaType: 'image' })}
                        className="accent-[#800020]"
                      />
                      <span>Image (ছবি)</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/10">
                      <input
                        type="radio"
                        name="trendingBannerMediaType"
                        value="video"
                        checked={form.trendingBannerMediaType === 'video'}
                        onChange={() => setForm({ ...form, trendingBannerMediaType: 'video' })}
                        className="accent-[#800020]"
                      />
                      <span>Video (ভিডিও লিংক)</span>
                    </label>
                  </div>
                </div>

                {/* Image Upload or URL */}
                {form.trendingBannerMediaType === 'image' ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-white/80">
                      Banner Image (ব্যানার ছবি)
                    </label>

                    {/* Direct Upload Button */}
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="relative inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-[#800020] to-[#5C0612] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:brightness-110 active:scale-95">
                        <Upload className="h-4 w-4" />
                        <span>
                          {uploadingBanner
                            ? 'Optimizing & Uploading...'
                            : 'Upload Image From Computer'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingBanner}
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleBannerUpload(file);
                          }}
                        />
                      </label>
                      <span className="text-xs text-white/40">or edit URL below:</span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={form.trendingBannerImageUrl}
                        onChange={(e) =>
                          setForm({ ...form, trendingBannerImageUrl: e.target.value })
                        }
                        placeholder="/images/trending-banner.jpg or /uploads/..."
                        className="w-full rounded-lg border border-white/10 bg-[#0E0E10] px-3.5 py-2 font-mono text-xs text-white placeholder:text-white/20 focus:border-[#800020] focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/80">
                      Banner Video URL (MP4 বা Embed URL)
                    </label>
                    <input
                      type="text"
                      value={form.trendingBannerVideoUrl}
                      onChange={(e) => setForm({ ...form, trendingBannerVideoUrl: e.target.value })}
                      placeholder="https://... or /videos/banner.mp4"
                      className="w-full rounded-lg border border-white/10 bg-[#0E0E10] px-3.5 py-2 font-mono text-xs text-white placeholder:text-white/20 focus:border-[#800020] focus:outline-none"
                    />
                  </div>
                )}

                {/* Target link and button text */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/80">
                      Target Page Link (ক্লিক করলে যেখানে যাবে)
                    </label>
                    <input
                      type="text"
                      value={form.trendingBannerLinkUrl}
                      onChange={(e) => setForm({ ...form, trendingBannerLinkUrl: e.target.value })}
                      placeholder="/trending"
                      className="w-full rounded-lg border border-white/10 bg-[#0E0E10] px-3.5 py-2 font-mono text-xs text-white placeholder:text-white/20 focus:border-[#800020] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-white/80">
                      Button Text (বাটন টেক্সট)
                    </label>
                    <input
                      type="text"
                      value={form.trendingBannerButtonText}
                      onChange={(e) =>
                        setForm({ ...form, trendingBannerButtonText: e.target.value })
                      }
                      placeholder="Explore Collection"
                      className="w-full rounded-lg border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs font-medium text-white placeholder:text-white/20 focus:border-[#800020] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Banner Live Preview */}
              <div>
                <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Live Banner Preview
                </span>
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
                  {form.trendingBannerMediaType === 'video' && form.trendingBannerVideoUrl ? (
                    <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-white/50">
                      [Video URL Preview: {form.trendingBannerVideoUrl}]
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={form.trendingBannerImageUrl || '/images/trending-banner.jpg'}
                      alt="Banner Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/trending-banner.jpg';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[#D4AF37]">
                        ★ Curated Selection
                      </span>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white">
                        GENTS HOOD
                      </h3>
                    </div>
                    <div className="rounded border border-[#e50914]/60 bg-[#e50914]/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm">
                      {form.trendingBannerButtonText || 'Explore Collection'} →
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Task 5: Homepage Product Preview Strip with Direct WebP Upload ── */}
          <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
            <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded bg-[#D4AF37]/20 px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#fce494]">
                    Image 5 • Task 5
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Homepage Product Preview Strip Cards (প্রিভিউ স্ট্রিপ ছবি ও টাইটেল)
                  </h2>
                </div>
                <p className="mt-1 text-xs text-white/50">
                  হোমপেইজের ডার্ক স্ট্রিপ কার্ডগুলোর ছবি ও নাম পরিবর্তন করুন। প্রতিটি কার্ডে সরাসরি
                  ইমেজ ফাইল আপলোড করা যায় যা স্বয়ংক্রিয়ভাবে হাই-কোয়ালিটি WebP তে রূপান্তর হয়।
                </p>
              </div>

              {form.galleryStrip.length < 6 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      galleryStrip: [
                        ...form.galleryStrip,
                        {
                          id: String(Date.now()),
                          title: `Card #${form.galleryStrip.length + 1}`,
                          image: '/images/gallery-front.jpg',
                        },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/10"
                >
                  <Plus className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span>Add New Card</span>
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {form.galleryStrip.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="relative rounded-xl border border-white/[0.08] bg-[#0E0E10] p-4 shadow-md transition-all hover:border-white/20"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <span className="font-mono text-xs font-bold text-[#D4AF37]">
                      Card #{idx + 1}
                    </span>
                    {form.galleryStrip.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.galleryStrip.filter((_, i) => i !== idx);
                          setForm({ ...form, galleryStrip: updated });
                        }}
                        className="rounded p-1 text-white/40 hover:bg-red-500/20 hover:text-red-400"
                        title="Remove Card"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail & Upload */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/gallery-front.jpg';
                        }}
                      />
                      {uploadingGalleryIdx === idx && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="relative inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-white/80 transition-all hover:bg-white/10">
                        <Upload className="h-3 w-3 text-[#D4AF37]" />
                        <span>{uploadingGalleryIdx === idx ? 'Uploading...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingGalleryIdx === idx}
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleGalleryUpload(file, idx);
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-white/40">Auto-compressed WebP</p>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                        Card Title
                      </label>
                      <input
                        type="text"
                        required
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...form.galleryStrip];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setForm({ ...form, galleryStrip: updated });
                        }}
                        placeholder="e.g. Front View"
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/20 focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                        Image URL
                      </label>
                      <input
                        type="text"
                        required
                        value={item.image}
                        onChange={(e) => {
                          const updated = [...form.galleryStrip];
                          updated[idx] = { ...updated[idx], image: e.target.value };
                          setForm({ ...form, galleryStrip: updated });
                        }}
                        placeholder="/images/gallery-front.jpg"
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-white/80 placeholder:text-white/20 focus:border-[#D4AF37] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Branding words */}
          <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
            <h2 className="border-b border-white/[0.08] pb-3 text-base font-bold text-white">
              Hero Section Typography
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                  Hero Tagline
                </label>
                <input
                  type="text"
                  value={form.heroTagline}
                  onChange={(e) => setForm({ ...form, heroTagline: e.target.value })}
                  placeholder="Fashion That Moves With You"
                  className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                  Hero Giant Background Watermark Word
                </label>
                <input
                  type="text"
                  value={form.heroBackgroundWord}
                  onChange={(e) => setForm({ ...form, heroBackgroundWord: e.target.value })}
                  placeholder="GENTS HOOD"
                  className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 font-mono text-xs uppercase text-white focus:border-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: FREQUENTLY ASKED QUESTIONS (Task 3)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
            <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded bg-emerald-500/20 px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Task 3
                  </span>
                  <h2 className="text-base font-bold text-white">
                    Frequently Asked Questions (FAQ ম্যানেজমেন্ট)
                  </h2>
                </div>
                <p className="mt-1 text-xs text-white/50">
                  ওয়েবসাইটের হোমপেইজের FAQ সেকশনের সব প্রশ্ন ও উত্তর এখান থেকে সরাসরি এডিট, নতুন
                  যোগ কিংবা ডিলিট করতে পারবেন।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, faqs: DEFAULT_FAQS })}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white"
                  title="Reset to default questions"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const newNum = String(form.faqs.length + 1).padStart(2, '0');
                    const newFaq: FAQItemData = {
                      id: `faq-${Date.now()}`,
                      number: newNum,
                      badge: 'Customer Care',
                      question: 'New Question Title?',
                      answer:
                        'Detailed and reassuring answer explaining policy, fabric, delivery or return details.',
                      highlights: ['Feature 1', 'Feature 2'],
                    };
                    setForm({ ...form, faqs: [...form.faqs, newFaq] });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/80 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add New FAQ</span>
                </button>
              </div>
            </div>

            {/* FAQs List */}
            <div className="mt-6 space-y-4">
              {form.faqs.map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  className="rounded-xl border border-white/[0.08] bg-[#0E0E10] p-5 shadow-lg transition-all hover:border-white/15"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400">
                        {faq.number || String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-white/60">
                        FAQ #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Move Up */}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...form.faqs];
                            const temp = updated[idx - 1];
                            updated[idx - 1] = updated[idx];
                            updated[idx] = temp;
                            setForm({ ...form, faqs: updated });
                          }}
                          className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Move Down */}
                      {idx < form.faqs.length - 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...form.faqs];
                            const temp = updated[idx + 1];
                            updated[idx + 1] = updated[idx];
                            updated[idx] = temp;
                            setForm({ ...form, faqs: updated });
                          }}
                          className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      {form.faqs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.faqs.filter((_, i) => i !== idx);
                            setForm({ ...form, faqs: updated });
                          }}
                          className="rounded p-1 text-white/40 hover:bg-red-500/20 hover:text-red-400"
                          title="Delete FAQ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                        Question Number
                      </label>
                      <input
                        type="text"
                        value={faq.number}
                        onChange={(e) => {
                          const updated = [...form.faqs];
                          updated[idx] = { ...updated[idx], number: e.target.value };
                          setForm({ ...form, faqs: updated });
                        }}
                        placeholder="01"
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                        Category Badge
                      </label>
                      <input
                        type="text"
                        value={faq.badge}
                        onChange={(e) => {
                          const updated = [...form.faqs];
                          updated[idx] = { ...updated[idx], badge: e.target.value };
                          setForm({ ...form, faqs: updated });
                        }}
                        placeholder="e.g. Fabric & Durability"
                        className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                      Question Text (প্রশ্ন)
                    </label>
                    <input
                      type="text"
                      required
                      value={faq.question}
                      onChange={(e) => {
                        const updated = [...form.faqs];
                        updated[idx] = { ...updated[idx], question: e.target.value };
                        setForm({ ...form, faqs: updated });
                      }}
                      placeholder="e.g. How is the fabric quality, and will it shrink or lose color after washing?"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                      Detailed Answer (উত্তর)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...form.faqs];
                        updated[idx] = { ...updated[idx], answer: e.target.value };
                        setForm({ ...form, faqs: updated });
                      }}
                      placeholder="Explain in reassuring detail..."
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white/90 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">
                      Key Highlights / Badges (কমা দিয়ে আলাদা করুন)
                    </label>
                    <input
                      type="text"
                      value={faq.highlights ? faq.highlights.join(', ') : ''}
                      onChange={(e) => {
                        const highlights = e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const updated = [...form.faqs];
                        updated[idx] = { ...updated[idx], highlights };
                        setForm({ ...form, faqs: updated });
                      }}
                      placeholder="100% Pre-Shrunk Fabric, Zero Color Bleed Guarantee, Long-Lasting Drape"
                      className="w-full rounded-md border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-emerald-300 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Accordion Preview */}
            <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#FAF8F5] p-6 text-black">
              <div className="mb-4 text-center">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-[#4A0E17]">
                  ✦ Transparency & Quality Assurance ✦
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-[#111]">
                  Frequently Asked Questions (Store Preview)
                </h3>
              </div>

              <div className="space-y-3">
                {form.faqs.slice(0, 3).map((f, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-[#4A0E17]/10 font-mono text-[10px] font-bold text-[#4A0E17]">
                        {f.number}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {f.badge}
                        </span>
                        <h4 className="text-xs font-bold text-neutral-900">{f.question}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: STORE & SHIPPING (Charges, Contacts, Socials)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'shipping' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Delivery Charges */}
            <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <Truck className="h-4 w-4 text-sky-400" />
                <h2 className="text-base font-bold text-white">Delivery Charges & Thresholds</h2>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                      Inside Dhaka (BDT)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={form.insideDhaka}
                      onChange={(e) => setForm({ ...form, insideDhaka: Number(e.target.value) })}
                      className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 font-mono text-xs text-white focus:border-sky-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                      Outside Dhaka (BDT)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={form.outsideDhaka}
                      onChange={(e) => setForm({ ...form, outsideDhaka: Number(e.target.value) })}
                      className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 font-mono text-xs text-white focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Free Delivery Order Minimum (BDT)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.freeDeliveryMin}
                    onChange={(e) => setForm({ ...form, freeDeliveryMin: Number(e.target.value) })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 font-mono text-xs text-white focus:border-sky-400 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-white/40">
                    Orders reaching or exceeding this amount receive free nationwide delivery.
                  </p>
                </div>
              </div>
            </div>

            {/* Atelier Contact Details */}
            <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <Phone className="h-4 w-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">Atelier Contact Channels</h2>
              </div>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                      Official Hotline
                    </label>
                    <input
                      type="text"
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                      Customer Support Email
                    </label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Direct WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Atelier Physical Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <Share2 className="h-4 w-4 text-[#D4AF37]" />
                <h2 className="text-base font-bold text-white">Social Media Channels & Presence</h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Facebook Page URL
                  </label>
                  <input
                    type="text"
                    value={form.facebook}
                    onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    TikTok Handle / URL
                  </label>
                  <input
                    type="text"
                    value={form.tiktok}
                    onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    YouTube Channel URL
                  </label>
                  <input
                    type="text"
                    value={form.youtube}
                    onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    WhatsApp Chat Link
                  </label>
                  <input
                    type="text"
                    value={form.whatsappLink}
                    onChange={(e) => setForm({ ...form, whatsappLink: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-white/50">
                    Messenger Link
                  </label>
                  <input
                    type="text"
                    value={form.messenger}
                    onChange={(e) => setForm({ ...form, messenger: e.target.value })}
                    className="w-full rounded-md border border-white/10 bg-[#0E0E10] px-3.5 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom Floating Save Bar ─── */}
      <div className="fixed bottom-6 right-8 z-40">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSaving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#800020] via-[#5C0612] to-[#800020] px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(128,0,32,0.5)] transition-all hover:scale-105 active:scale-95"
        >
          <Save className="h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </form>
  );
}
