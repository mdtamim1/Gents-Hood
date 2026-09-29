// Rate limiting stub for API routes
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function rateLimit(_identifier: string): Promise<RateLimitResult> {
  return {
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
  };
}
