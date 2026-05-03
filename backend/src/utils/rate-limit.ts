/**
 * DB-backed sliding-window rate limiter.
 * Survives restarts and works across multiple instances.
 * Uses the existing PostgreSQL DB — no Redis required.
 */

import { db } from "../config/db";
import { logger } from "./logger";

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

/**
 * Returns true if request is ALLOWED, false if rate-limited.
 */
export async function rateLimit(
  key: string,
  module: string,
  { limit, windowMs }: RateLimitOptions
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs);

  try {
    // Lazy prune — 5% of calls clean up stale rows
    if (Math.random() < 0.05) {
      db.rateLimitEntry
        .deleteMany({ where: { createdAt: { lt: windowStart } } })
        .catch(() => {});
    }

    const count = await db.rateLimitEntry.count({
      where: { key, module, createdAt: { gte: windowStart } },
    });

    if (count >= limit) return false;

    await db.rateLimitEntry.create({ data: { key, module } });
    return true;
  } catch (err) {
    // Fail open — a DB hiccup shouldn't block all traffic
    logger.error("Rate limiter DB error — failing open", { error: String(err), key, module });
    return true;
  }
}

export const rateLimits = {
  export:   (userId: string) => rateLimit(userId, "export",   { limit: 10, windowMs: 60_000 }),
  leave:    (userId: string) => rateLimit(userId, "leave",    { limit: 20, windowMs: 60_000 }),
  timelog:  (userId: string) => rateLimit(userId, "timelog",  { limit: 30, windowMs: 60_000 }),
  adminOps: (userId: string) => rateLimit(userId, "adminOps", { limit: 60, windowMs: 60_000 }),
  login:    (email: string)  => rateLimit(email,  "login",    { limit: 5,  windowMs: 15 * 60_000 }),
};
