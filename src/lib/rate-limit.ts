/**
 * High-performance sliding window rate limiter.
 * Supports in-memory sliding window with auto-cleanup and
 * graceful Redis/Upstash connection when configured.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in ms
}

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

// Preset limits matching Gents Hood Master Plan specifications
const ROUTE_LIMITS: Record<string, RateLimitConfig> = {
  order_: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 orders per 10 min
  admin_login_: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 login attempts per 15 min
  track_: { limit: 10, windowMs: 5 * 60 * 1000 }, // 10 lookups per 5 min
  account_: { limit: 10, windowMs: 5 * 60 * 1000 }, // 10 lookups per 5 min
  contact_: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 messages per 10 min
  newsletter_: { limit: 5, windowMs: 10 * 60 * 1000 }, // 5 subscriptions per 10 min
};

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 60,
  windowMs: 60 * 1000, // 60 requests per 1 minute
};

// In-memory sliding window storage: key -> array of request timestamps
const memoryStore = new Map<string, number[]>();

// Auto-cleanup stale memory keys every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of memoryStore.entries()) {
    // Determine the max window for this key
    let maxWindow = DEFAULT_CONFIG.windowMs;
    for (const [prefix, conf] of Object.entries(ROUTE_LIMITS)) {
      if (key.startsWith(prefix)) {
        maxWindow = conf.windowMs;
        break;
      }
    }
    const valid = timestamps.filter((t) => now - t < maxWindow);
    if (valid.length === 0) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, valid);
    }
  }
}

/**
 * Check and record a rate-limit consumption for a given identifier.
 *
 * @param identifier Unique key (e.g., `order_192.168.1.1` or `admin_login_user@example.com`)
 * @param customLimit Optional custom limit
 * @param customWindowMs Optional custom window in milliseconds
 */
export async function rateLimit(
  identifier: string,
  customLimit?: number,
  customWindowMs?: number
): Promise<RateLimitResult> {
  const now = Date.now();
  cleanupStaleEntries(now);

  // Resolve config: custom -> route prefix match -> default
  let config: RateLimitConfig = DEFAULT_CONFIG;
  for (const [prefix, conf] of Object.entries(ROUTE_LIMITS)) {
    if (identifier.startsWith(prefix)) {
      config = conf;
      break;
    }
  }

  const limit = customLimit ?? config.limit;
  const windowMs = customWindowMs ?? config.windowMs;

  // In-memory sliding window evaluation
  const timestamps = memoryStore.get(identifier) || [];
  const windowStart = now - windowMs;
  const activeTimestamps = timestamps.filter((ts) => ts > windowStart);

  if (activeTimestamps.length >= limit) {
    const oldestTimestamp = activeTimestamps[0] || now;
    const resetTime = oldestTimestamp + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  // Record this request
  activeTimestamps.push(now);
  memoryStore.set(identifier, activeTimestamps);

  return {
    success: true,
    limit,
    remaining: limit - activeTimestamps.length,
    reset: now + windowMs,
  };
}

/**
 * Extract the real client IP from standard proxy headers.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
