import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only create Redis client when Upstash is configured (skip in local dev)
const redis = process.env.UPSTASH_REDIS_REST_URL ? Redis.fromEnv() : null;

function limiter(
  requests: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  prefix: string,
): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `rl:${prefix}`,
  });
}

export const rateLimiters = {
  apply: limiter(20, "1 d", "apply"),
  createRoom: limiter(5, "1 d", "room"),
  exportData: limiter(3, "1 d", "export"),
  joinShareLink: limiter(10, "1 d", "join"),
} as const;

/**
 * Check rate limit. Returns false if exceeded.
 * No-ops (returns true) when Upstash is not configured (local dev).
 */
export async function checkRateLimit(rl: Ratelimit | null, identifier: string): Promise<boolean> {
  if (!rl) return true;
  const { success } = await rl.limit(identifier);
  return success;
}
