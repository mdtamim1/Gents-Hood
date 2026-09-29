import React from 'react';
import { getSiteSettings } from '@/lib/services/settings.service';
import { FooterContent } from './FooterContent';

export async function Footer() {
  const settings = await getSiteSettings();

  let socialLinks = {
    facebook: 'https://facebook.com/gentshood',
    instagram: 'https://instagram.com/gentshood',
    tiktok: 'https://tiktok.com/@gentshood',
    youtube: 'https://youtube.com/@gentshood',
    whatsapp: 'https://wa.me/8801700000000',
    messenger: 'https://m.me/gentshood',
  };

  if (settings.socialLinks) {
    try {
      socialLinks = { ...socialLinks, ...JSON.parse(settings.socialLinks) };
    } catch {
      // Ignore
    }
  }

  return (
    <FooterContent
      contactPhone={settings.contactPhone}
      contactEmail={settings.contactEmail}
      whatsapp={settings.whatsapp}
      address={settings.address}
      socialLinks={socialLinks}
    />
  );
}
