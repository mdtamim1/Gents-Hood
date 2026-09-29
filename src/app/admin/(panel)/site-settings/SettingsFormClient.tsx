'use client';

import React, { useState } from 'react';
import { Save, Phone, Truck, Share2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

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

  const [form, setForm] = useState({
    announcementText: initialSettings.announcementText || 'FREE DELIVERY ON ORDERS ABOVE ৳1,999',
    freeDeliveryMin: initialSettings.freeDeliveryMin ?? 1999,
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
      </div>
    </form>
  );
}
