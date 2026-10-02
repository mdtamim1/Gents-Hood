import type { Metadata, Viewport } from 'next';
import { Inter_Tight, Cinzel, Playfair_Display } from 'next/font/google';
import './globals.css';
import { MetaPixel } from '@/components/analytics/MetaPixel';
import { getSiteUrl } from '@/lib/constants/site';

const interTight = Inter_Tight({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter-tight',
  weight: ['400', '500', '600', '700', '800'],
});

const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
  weight: ['500', '600', '700', '800', '900'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['500', '600', '700', '800', '900'],
});

const siteUrl = getSiteUrl();

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
    'Fashion that moves with you. Elevate your everyday wardrobe with Gents Hood premium menswear, overcoats, jackets, and essentials in Bangladesh.',
  keywords: [
    'Gents Hood',
    'Gents Hood Bangladesh',
    'Menswear Bangladesh',
    'Premium Mens Fashion Dhaka',
    'Streetwear Bangladesh',
    'Winter Overcoats Dhaka',
    'Tailored Jackets Bangladesh',
    'Editorial Menswear',
    'Men Clothing Brand BD',
    'Online Mens Shop Dhaka',
  ],
  authors: [{ name: 'Gents Hood', url: siteUrl }],
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
        url: `${siteUrl}/images/gentshood-og.jpg?v=1`,
        width: 1200,
        height: 630,
        alt: 'Gents Hood | Premium Menswear & Editorial Streetwear',
        type: 'image/jpeg',
      },
      {
        url: `${siteUrl}/images/gentshood-collection-banner.jpg`,
        width: 1200,
        height: 630,
        alt: 'Gents Hood Premium Menswear & Editorial Streetwear',
        type: 'image/jpeg',
      },
      {
        url: `${siteUrl}/images/logo.png`,
        width: 695,
        height: 282,
        alt: 'Gents Hood Official Logo',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gents Hood | Premium Menswear & Editorial Streetwear',
    description: 'Fashion that moves with you. Curated premium menswear and essentials.',
    images: [`${siteUrl}/images/gentshood-og.jpg?v=1`],
  },
  verification: {
    google:
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
      'CxAIpOKbg94fbzQWU8nKN24wje7l59i3wvh1IG58_40',
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
    <html lang="en" className={`${interTight.variable} ${cinzel.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
