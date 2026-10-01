import { redis } from './redis';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();
const KEY_PREFIX = 'gh:cache:';

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

  // Populate L1
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
export function invalidateCacheKey(key: string): void {
  memoryStore.delete(key);

  if (redis) {
    const redisKey = `${KEY_PREFIX}${key}`;
    redis.del(redisKey).catch((e) => {
      console.warn(`[Redis Cache] Delete error for key "${redisKey}":`, e);
    });
  }
}

/**
 * Invalidate all cache keys matching a prefix
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }

  if (redis) {
    const pattern = `${KEY_PREFIX}${prefix}*`;
    redis
      .keys(pattern)
      .then((keys) => {
        if (keys && keys.length > 0) {
          redis?.del(...keys).catch((e) => {
            console.warn(`[Redis Cache] Prefix delete error:`, e);
          });
        }
      })
      .catch(() => {});
  }
}
