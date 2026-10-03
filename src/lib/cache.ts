import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { redis } from './redis';
import { autoNotifySearchEngines } from '@/lib/services/indexing.service';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();
const KEY_PREFIX = 'gh:cache:';
// Max L1 entries to prevent memory bloat in serverless environments
const MAX_MEMORY_ENTRIES = 100;
// L1 in-memory micro-cache TTL (3 seconds).
// In serverless and multi-container environments, keeping L1 TTL short (3s) ensures that updates
// from another instance (e.g. Admin API) propagate within seconds, while still shielding Redis and DB
// from concurrent burst traffic (thundering herd).
const MAX_L1_TTL_MS = 3000;

/**
 * Multi-tier cache helper:
 * 1. Checks fast in-memory store (L1)
 * 2. Checks Upstash Redis (L2) for edge consistency across serverless instances
 * 3. Falls back to fetchFn and populates both layers
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const redisKey = `${KEY_PREFIX}${key}`;

  // 1. Check L1 in-memory cache
  const memoryCached = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (memoryCached && memoryCached.expiresAt > now) {
    return memoryCached.value;
  }

  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

  // 2. Check L2 Upstash Redis cache (skip during build-time static generation)
  if (!isBuild && redis) {
    try {
      const redisCached = await redis.get<T>(redisKey);
      if (redisCached !== null && redisCached !== undefined) {
        const l1TtlMs = Math.min(ttlSeconds * 1000, MAX_L1_TTL_MS);
        memoryStore.set(key, {
          value: redisCached,
          expiresAt: now + l1TtlMs,
        });
        return redisCached;
      }
    } catch (e) {
      console.warn(`[Redis Cache] Read error for key "${redisKey}":`, e);
    }
  }

  // 3. Fetch fresh value
  const freshValue = await fetchFn();

  // Populate L1 (with size cap: evict oldest entry if at limit)
  if (memoryStore.size >= MAX_MEMORY_ENTRIES) {
    const oldestKey = memoryStore.keys().next().value;
    if (oldestKey) memoryStore.delete(oldestKey);
  }
  const l1TtlMs = Math.min(ttlSeconds * 1000, MAX_L1_TTL_MS);
  memoryStore.set(key, {
    value: freshValue,
    expiresAt: now + l1TtlMs,
  });

  // Populate L2 Redis
  if (!isBuild && redis) {
    try {
      await redis.set(redisKey, freshValue, { ex: ttlSeconds });
    } catch (e) {
      console.warn(`[Redis Cache] Write error for key "${redisKey}":`, e);
    }
  }

  return freshValue;
}

/**
 * Invalidate a specific cache key across both L1 and L2
 */
export async function invalidateCacheKey(key: string): Promise<void> {
  memoryStore.delete(key);

  if (redis) {
    const redisKey = `${KEY_PREFIX}${key}`;
    try {
      await redis.del(redisKey);
    } catch (e) {
      console.warn(`[Redis Cache] Delete error for key "${redisKey}":`, e);
    }
  }
}

/**
 * Invalidate all cache keys matching a prefix across both L1 and L2
 */
export async function invalidateCachePrefix(prefix: string): Promise<void> {
  for (const key of Array.from(memoryStore.keys())) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }

  if (redis) {
    const pattern = `${KEY_PREFIX}${prefix}*`;
    try {
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (e) {
      console.warn(`[Redis Cache] Prefix delete error:`, e);
    }
  }
}

/**
 * Invalidate all product caches (featured, trending limits, and slugs)
 */
export async function invalidateAllProductCaches(slug?: string): Promise<void> {
  await Promise.all([
    invalidateCachePrefix('trending_products_'),
    invalidateCacheKey('featured_product'),
    invalidateCacheKey('trending_catalog'),
    slug ? invalidateCacheKey(`product_${slug}`) : invalidateCachePrefix('product_'),
  ]);
}

/**
 * Cross-Domain HTTP revalidation call.
 *
 * WHY THIS IS NEEDED:
 * Admin runs on admin.gentshood.com — a separate Vercel deployment (or same deployment
 * but different origin). Next.js revalidatePath() and revalidateTag() only work within
 * the CURRENT serverless function's cache namespace. Calling them from admin.gentshood.com
 * has ZERO effect on gentshood.com's cache.
 *
 * This function makes an HTTP POST to gentshood.com/api/revalidate, which runs inside
 * the main domain's serverless environment and can properly purge its own cache.
 */
async function triggerCrossDomainRevalidation(slug?: string): Promise<void> {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    const secret = process.env.REVALIDATE_SECRET || process.env.CRON_SECRET;

    // Only trigger if we have a real production URL and secret
    if (!siteUrl || !secret || siteUrl.includes('localhost')) return;

    // Normalize: strip trailing slash, ensure https
    const baseUrl = siteUrl.replace(/\/$/, '');
    const revalidateUrl = `${baseUrl}/api/revalidate`;

    const response = await fetch(revalidateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ slug: slug || null }),
      // Short timeout — don't let this block the admin API response
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(
        `[Cache] Cross-domain revalidation failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (err) {
    // Non-blocking — log and continue
    console.warn('[Cache] Cross-domain revalidation error (non-fatal):', err);
  }
}

/**
 * Trigger Next.js On-Demand Revalidation for storefront routes.
 *
 * This function fires BOTH:
 * 1. Local revalidatePath/revalidateTag (works when admin and store are same deployment)
 * 2. Cross-domain HTTP call to /api/revalidate (works when admin is on a subdomain)
 */
export function revalidateStorefront(slug?: string): void {
  try {
    // 1. Tag-based global on-demand revalidation (works across subdomains and multi-domain edge caches)
    try {
      revalidateTag('site_settings');
      revalidateTag('products');
      revalidateTag('featured_product');
      revalidateTag('trending_products');
      if (slug) {
        revalidateTag(`product_${slug}`);
      }
    } catch (tagErr) {
      console.warn('[Cache] revalidateTag warning:', tagErr);
    }

    // 2. Path-based on-demand revalidation for all storefront routes
    revalidatePath('/', 'page');
    revalidatePath('/', 'layout');
    revalidatePath('/trending', 'page');
    revalidatePath('/contact', 'page');
    if (slug) {
      revalidatePath(`/product/${slug}`, 'page');
    }

    // 3. Cross-domain HTTP revalidation (admin.gentshood.com → gentshood.com)
    // Fire-and-forget — does not block the admin API response
    triggerCrossDomainRevalidation(slug).catch(() => {});

    // Automatically broadcast updated pages to Google & IndexNow search engines
    const pathsToNotify = ['/', '/trending', '/sitemap.xml'];
    if (slug) {
      pathsToNotify.unshift(`/product/${slug}`);
    }
    autoNotifySearchEngines(pathsToNotify);
  } catch (err) {
    console.warn('[Cache] revalidateStorefront error:', err);
  }
}

/**
 * unstable_cache wrapper with proper Next.js tags for revalidateTag() to work.
 * Use this for any data that needs instant cache busting via revalidateTag.
 */
export function makeTaggedCache<T>(
  fn: (...args: unknown[]) => Promise<T>,
  keyParts: string[],
  tags: string[],
  revalidateSeconds = 30
) {
  return unstable_cache(fn, keyParts, {
    tags,
    revalidate: revalidateSeconds,
  });
}
