import { revalidatePath } from 'next/cache';
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
        memoryStore.set(key, {
          value: redisCached,
          expiresAt: now + ttlSeconds * 1000,
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
  memoryStore.set(key, {
    value: freshValue,
    expiresAt: now + ttlSeconds * 1000,
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
 * Trigger Next.js On-Demand Revalidation for storefront routes
 */
export function revalidateStorefront(slug?: string): void {
  try {
    revalidatePath('/', 'page');
    revalidatePath('/', 'layout');
    revalidatePath('/trending', 'page');
    revalidatePath('/contact', 'page');
    if (slug) {
      revalidatePath(`/product/${slug}`, 'page');
    }

    // Automatically broadcast updated pages to Google & IndexNow search engines
    const pathsToNotify = ['/', '/trending', '/sitemap.xml'];
    if (slug) {
      pathsToNotify.unshift(`/product/${slug}`);
    }
    autoNotifySearchEngines(pathsToNotify);
  } catch (err) {
    console.warn('[Cache] revalidatePath error:', err);
  }
}
