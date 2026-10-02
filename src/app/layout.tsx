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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
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
    other: {
      'facebook-domain-verification': '0vbm0cg0qqo0vj2qzy47ow729kg81x',
    },
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
      <head>
        {/* Google Tag Manager */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WNQLRP52');`,
          }}
        />
        {/* End Google Tag Manager */}
      </head>
      <body className="font-sans antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WNQLRP52"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
