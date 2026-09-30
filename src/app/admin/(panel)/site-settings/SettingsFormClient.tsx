'use client';

import React, { useState } from 'react';
import { Save, Phone, Truck, Share2, Tag, Images, Trash2, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export interface GalleryStripItem {
  id?: string;
  title: string;
  image: string;
}

const DEFAULT_GALLERY_STRIP: GalleryStripItem[] = [
  { id: '1', title: 'Front View', image: '/images/gallery-front.jpg' },
  { id: '2', title: 'Texture & Detail', image: '/images/gallery-detail.jpg' },
  { id: '3', title: 'Silhouette Fit', image: '/images/gallery-lifestyle.jpg' },
];

interface SiteSettingData {
  announcementText?: string | null;
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
}

export function SettingsFormClient({ initialSettings }: { initialSettings: SiteSettingData }) {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  let parsedCharges = { insideDhaka: 70, outsideDhaka: 130 };
  if (initialSettings.deliveryCharges) {
    try {
      parsedCharges = JSON.parse(initialSettings.deliveryCharges);
    } catch {
      // Ignore
    }
  }

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
      // Ignore
    }
  }

  let parsedGallery: GalleryStripItem[] = DEFAULT_GALLERY_STRIP;
  if (initialSettings.galleryStripJson) {
    try {
      const parsed = JSON.parse(initialSettings.galleryStripJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsedGallery = parsed;
      }
    } catch {
      // Ignore
    }
  }

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
      // Ignore
    }
  }

  const [form, setForm] = useState({
    announcementText: initialSettings.announcementText || '',
    freeDeliveryMin: initialSettings.freeDeliveryMin ?? 0,
    insideDhaka: parsedCharges.insideDhaka || 70,
    outsideDhaka: parsedCharges.outsideDhaka || 130,
    contactPhone: initialSettings.contactPhone || '+8801700000000',
    contactEmail: initialSettings.contactEmail || 'contact@gentshood.com',
    whatsapp: initialSettings.whatsapp || '+8801700000000',
    address: initialSettings.address || 'Gulshan 2, Dhaka, Bangladesh',
    heroTagline: initialSettings.heroTagline || 'Fashion That Moves With You',
    heroBackgroundWord: initialSettings.heroBackgroundWord || 'GENTS HOOD',
    facebook: parsedSocial.facebook || '',
    instagram: parsedSocial.instagram || '',
    tiktok: parsedSocial.tiktok || '',
    youtube: parsedSocial.youtube || '',
    whatsappLink: parsedSocial.whatsapp || '',
    messenger: parsedSocial.messenger || '',
    galleryStrip: parsedGallery,
    trendingBannerMediaType: parsedTrendingBanner.mediaType || 'image',
    trendingBannerImageUrl: parsedTrendingBanner.imageUrl || '/images/trending-banner.jpg',
    trendingBannerVideoUrl: parsedTrendingBanner.videoUrl || '',
    trendingBannerLinkUrl: parsedTrendingBanner.linkUrl || '/trending',
    trendingBannerButtonText: parsedTrendingBanner.buttonText || 'Explore Collection',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        announcementText: form.announcementText,
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

      showToast('Site settings updated! Storefront caches refreshed.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving settings';
      showToast(msg, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="border-muted/20 flex items-center justify-between border-b pb-4">
        <div>
          <span className="label-caps tracking-widest text-muted">Store Operations</span>
          <h1 className="heading-xl mt-1 tracking-tight text-cream">Site & Atelier Settings</h1>
          <p className="mt-1 text-xs text-muted">
            Configure delivery rules, announcement headlines, customer service hotlines, and social
            media channels.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSaving}
          className="bg-cream text-xs font-bold uppercase tracking-wider text-ink hover:bg-cream-soft"
        >
          <Save className="mr-1.5 h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Card: Shipping & Delivery Rules */}
        <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
          <div className="border-muted/10 flex items-center gap-2 border-b pb-2">
            <Truck className="h-4 w-4 text-cream" />
            <h2 className="heading-sm text-cream">Delivery Charges & Thresholds</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Inside Dhaka (BDT)
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.insideDhaka}
                onChange={(e) => setForm({ ...form, insideDhaka: Number(e.target.value) })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 font-mono text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Outside Dhaka (BDT)
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.outsideDhaka}
                onChange={(e) => setForm({ ...form, outsideDhaka: Number(e.target.value) })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 font-mono text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
              Free Delivery Order Minimum (BDT)
            </label>
            <input
              type="number"
              min={0}
              required
              value={form.freeDeliveryMin}
              onChange={(e) => setForm({ ...form, freeDeliveryMin: Number(e.target.value) })}
              className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 font-mono text-xs text-cream focus:border-cream focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-muted">
              Orders matching or exceeding this amount receive complimentary delivery across
              Bangladesh.
            </p>
          </div>
        </div>

        {/* Card: Brand & Announcement */}
        <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
          <div className="border-muted/10 flex items-center gap-2 border-b pb-2">
            <Tag className="h-4 w-4 text-cream" />
            <h2 className="heading-sm text-cream">Store Announcements & Brand Copy</h2>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
              Announcement Bar Headline
            </label>
            <input
              type="text"
              required
              value={form.announcementText}
              onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
              className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
              Hero Tagline
            </label>
            <input
              type="text"
              value={form.heroTagline}
              onChange={(e) => setForm({ ...form, heroTagline: e.target.value })}
              className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
              Hero Giant Background Word
            </label>
            <input
              type="text"
              value={form.heroBackgroundWord}
              onChange={(e) => setForm({ ...form, heroBackgroundWord: e.target.value })}
              className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs uppercase text-cream focus:border-cream focus:outline-none"
            />
          </div>
        </div>

        {/* Card: Homepage Preview Gallery Strip (Image & Title Management) */}
        <div className="border-muted/20 space-y-5 border bg-[#1a1a1c] p-6">
          <div className="border-muted/10 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2.5">
              <Images className="h-4 w-4 text-cream" />
              <div>
                <h2 className="heading-sm text-cream">Homepage Product Preview Strip</h2>
                <p className="text-[11px] text-muted">
                  Manage the preview images and titles displayed on the homepage dark strip.
                  Customers can click these to view the full image.
                </p>
              </div>
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
                        title: `Preview ${form.galleryStrip.length + 1}`,
                        image: '/images/gallery-front.jpg',
                      },
                    ],
                  })
                }
                className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-cream underline underline-offset-4 hover:opacity-80"
              >
                <Plus className="h-3 w-3" /> Add Card
              </button>
            )}
          </div>

          <div className="space-y-4">
            {form.galleryStrip.map((item, idx) => (
              <div
                key={item.id || idx}
                className="border-muted/20 bg-ink/60 flex flex-col gap-4 border p-4 sm:flex-row sm:items-center sm:gap-6"
              >
                {/* Thumbnail Preview */}
                <div className="border-muted/30 relative h-20 w-16 flex-shrink-0 overflow-hidden border bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/gallery-front.jpg';
                    }}
                  />
                </div>

                {/* Title & Image URL Inputs */}
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted">
                      Card #{idx + 1} Title
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
                      className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted">
                      Card #{idx + 1} Image URL
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
                      placeholder="/images/gallery-front.jpg or Cloudinary URL"
                      className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
                    />
                  </div>
                </div>

                {/* Remove button if more than 1 item */}
                {form.galleryStrip.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = form.galleryStrip.filter((_, i) => i !== idx);
                      setForm({ ...form, galleryStrip: updated });
                    }}
                    className="self-end p-1 text-muted transition-colors hover:text-danger sm:self-center"
                    title="Remove Card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Card: Atelier & Contact Details */}
        <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
          <div className="border-muted/10 flex items-center gap-2 border-b pb-2">
            <Phone className="h-4 w-4 text-cream" />
            <h2 className="heading-sm text-cream">Atelier Contact Channels</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Official Hotline
              </label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Customer Support Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
              Direct WhatsApp Number
            </label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
              Atelier Physical Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
            />
          </div>
        </div>

        {/* Card: Social Media Links */}
        <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
          <div className="border-muted/10 flex items-center gap-2 border-b pb-2">
            <Share2 className="h-4 w-4 text-cream" />
            <h2 className="heading-sm text-cream">Social Media Presence</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Facebook Page URL
              </label>
              <input
                type="text"
                value={form.facebook}
                onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Instagram URL
              </label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                TikTok Handle / URL
              </label>
              <input
                type="text"
                value={form.tiktok}
                onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                YouTube Channel URL
              </label>
              <input
                type="text"
                value={form.youtube}
                onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Direct WhatsApp Link
              </label>
              <input
                type="text"
                value={form.whatsappLink}
                onChange={(e) => setForm({ ...form, whatsappLink: e.target.value })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Messenger Link
              </label>
              <input
                type="text"
                value={form.messenger}
                onChange={(e) => setForm({ ...form, messenger: e.target.value })}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card: Trending / Collection Banner (Homepage) */}
        <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
          <div className="border-muted/10 flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cream" />
              <h2 className="heading-sm text-cream">
                Trending Collection Banner (হোমপেইজ ব্যানার)
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase text-muted">Homepage Section</span>
          </div>

          <p className="text-xs text-muted">
            হোমপেইজের &quot;BEST OF GENTS HOOD&quot; সেকশনে প্রদর্শিত ব্যানার কাস্টমাইজ করুন। চাইলে
            ইমেজ বা ভিডিও দিতে পারেন এবং ক্লিক করলে কোন পেজে যাবে তা নির্ধারণ করতে পারেন।
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Media Type (মিডিয়া টাইপ)
              </label>
              <div className="flex items-center gap-6 pt-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-cream">
                  <input
                    type="radio"
                    name="trendingBannerMediaType"
                    value="image"
                    checked={form.trendingBannerMediaType === 'image'}
                    onChange={() => setForm({ ...form, trendingBannerMediaType: 'image' })}
                    className="accent-[#4A0E17]"
                  />
                  <span>Image (ছবি)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-xs text-cream">
                  <input
                    type="radio"
                    name="trendingBannerMediaType"
                    value="video"
                    checked={form.trendingBannerMediaType === 'video'}
                    onChange={() => setForm({ ...form, trendingBannerMediaType: 'video' })}
                    className="accent-[#4A0E17]"
                  />
                  <span>Video (ভিডিও)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Target Page Link (ক্লিক করলে যে লিংকে যাবে)
              </label>
              <input
                type="text"
                value={form.trendingBannerLinkUrl}
                onChange={(e) => setForm({ ...form, trendingBannerLinkUrl: e.target.value })}
                placeholder="/trending"
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            {form.trendingBannerMediaType === 'image' ? (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Banner Image URL (ছবির লিংক বা পাথ)
                </label>
                <input
                  type="text"
                  value={form.trendingBannerImageUrl}
                  onChange={(e) => setForm({ ...form, trendingBannerImageUrl: e.target.value })}
                  placeholder="/images/trending-banner.jpg"
                  className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
                />
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Banner Video URL (MP4 ভিডিও বা YouTube Embed লিংক)
                </label>
                <input
                  type="text"
                  value={form.trendingBannerVideoUrl}
                  onChange={(e) => setForm({ ...form, trendingBannerVideoUrl: e.target.value })}
                  placeholder="https://... or /videos/banner.mp4"
                  className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Action Button Text (ব্যানারের বাটন টেক্সট)
              </label>
              <input
                type="text"
                value={form.trendingBannerButtonText}
                onChange={(e) => setForm({ ...form, trendingBannerButtonText: e.target.value })}
                placeholder="Explore Collection"
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="border-muted/10 mt-4 border-t pt-4">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted">
              Live Preview (লাইভ প্রিভিউ):
            </span>
            <div className="relative aspect-[16/9] max-w-md overflow-hidden rounded-lg border border-white/10 bg-black">
              {form.trendingBannerMediaType === 'video' && form.trendingBannerVideoUrl ? (
                <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-muted">
                  [Video Preview: {form.trendingBannerVideoUrl}]
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={form.trendingBannerImageUrl || '/images/trending-banner.jpg'}
                  alt="Trending Banner Preview"
                  className="h-full w-full object-contain"
                />
              )}
              <div className="absolute bottom-2 right-2 rounded-full bg-[#4A0E17] px-3 py-1 text-[10px] font-bold text-cream">
                {form.trendingBannerButtonText || 'Explore Collection'} →
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
