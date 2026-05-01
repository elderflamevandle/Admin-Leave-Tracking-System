// In-process sliding-window rate limiter.
// For multi-instance deployments, replace the Map with a Redis INCR + EXPIRE.
const store = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= limit) return false;
  store.set(key, [...timestamps, now]);
  return true;
}

// Convenience wrappers for common surfaces
export const rateLimits = {
  export:   (userId: string) => rateLimit(`export:${userId}`,   10,  60_000),  // 10/min
  leave:    (userId: string) => rateLimit(`leave:${userId}`,    20,  60_000),  // 20/min
  timelog:  (userId: string) => rateLimit(`timelog:${userId}`,  30,  60_000),  // 30/min
  adminOps: (userId: string) => rateLimit(`admin:${userId}`,    60,  60_000),  // 60/min
};
