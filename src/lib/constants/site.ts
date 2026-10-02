/**
 * Resolves the canonical base site URL for SEO, metadata, sitemaps, and robots.txt.
 * Prioritizes NEXT_PUBLIC_SITE_URL if configured.
 * Defaults to 'https://www.gentshood.com' in production (matching Vercel's live primary domain).
 */
export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (process.env.NODE_ENV === 'production') {
    if (envUrl && !envUrl.includes('localhost')) {
      return envUrl.replace(/\/+$/, '');
    }
    return 'https://www.gentshood.com';
  }

  return envUrl ? envUrl.replace(/\/+$/, '') : 'http://localhost:3000';
}

export const SITE_URL = getSiteUrl();
