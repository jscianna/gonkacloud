/**
 * Simple in-memory rate limiter (no Redis required).
 * Note: This won't persist across serverless function instances,
 * but provides basic protection. For production scale, add Redis back.
 */

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 60; // 60 requests per minute

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60 * 1000);

export async function rateLimit(identifier: string) {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      remaining: maxRequests - 1,
      reset: now + windowMs,
      limit: maxRequests,
    };
  }

  // Existing window
  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  return {
    success: entry.count <= maxRequests,
    remaining,
    reset: entry.resetAt,
    limit: maxRequests,
  };
}
