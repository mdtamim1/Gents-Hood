import type { Metadata, Viewport } from 'next';
import { Inter_Tight } from 'next/font/google';
import './globals.css';
import { MetaPixel } from '@/components/analytics/MetaPixel';

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-tight',
  weight: ['400', '500', '600', '700', '800'],
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gentshood.com').replace(/\/+$/, '');

export const viewport: Viewport = {
  themeColor: '#171718',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gents Hood | Premium Menswear & Editorial Streetwear',
    template: '%s | Gents Hood',
  },
  description:
    'Fashion that moves with you. Elevate your everyday wardrobe with Gents Hood premium menswear, overcoats, jackets, and essentials.',
  keywords: [
    'Gents Hood',
    'Menswear Bangladesh',
    'Premium Mens Fashion Dhaka',
    'Streetwear Bangladesh',
    'Winter Overcoats',
    'Tailored Jackets',
    'Editorial Menswear',
  ],
  authors: [{ name: 'Gents Hood' }],
  creator: 'Gents Hood',
  publisher: 'Gents Hood',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Gents Hood',
    title: 'Gents Hood | Premium Menswear & Editorial Streetwear',
    description:
      'Fashion that moves with you. Discover curated menswear crafted for effortless movement and timeless presence.',
    images: [
      {
        url: '/images/hero-model.png',
        width: 1200,
        height: 630,
        alt: 'Gents Hood Premium Menswear',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gents Hood | Premium Menswear & Editorial Streetwear',
    description: 'Fashion that moves with you. Curated premium menswear and essentials.',
    images: ['/images/hero-model.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={interTight.variable}>
      <body className="font-sans antialiased selection:bg-ink selection:text-cream">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
