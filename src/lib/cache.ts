interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();

/**
 * Cache helper function: gets cached data or fetches, stores, and returns fresh data.
 * @param key unique cache key
 * @param ttlSeconds time-to-live in seconds
 * @param fetchFn async function to fetch fresh data
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const cached = memoryStore.get(key) as CacheEntry<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  // Fetch fresh value
  const freshValue = await fetchFn();

  memoryStore.set(key, {
    value: freshValue,
    expiresAt: now + ttlSeconds * 1000,
  });

  return freshValue;
}

/**
 * Invalidate a specific cache key
 */
export function invalidateCacheKey(key: string): void {
  memoryStore.delete(key);
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
}
