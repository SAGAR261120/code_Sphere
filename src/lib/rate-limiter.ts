/**
 * CPC Marketplace — Production Rate Limiting & Abuse Defense Engine
 * High-performance sliding window rate limiter with tiered quotas and automatic cleanup.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export interface RateLimitTier {
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  AUTH: { limit: 10, windowMs: 60 * 1000 },          // 10 req/min for auth actions
  PAYMENT: { limit: 15, windowMs: 60 * 1000 },       // 15 req/min for checkout & deposits
  DOWNLOAD: { limit: 30, windowMs: 60 * 1000 },      // 30 req/min for signed downloads
  ADMIN: { limit: 60, windowMs: 60 * 1000 },         // 60 req/min for admin operations
  DEFAULT: { limit: 120, windowMs: 60 * 1000 },      // 120 req/min for general API
};

class RateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private lastCleanup: number = Date.now();
  private cleanupIntervalMs: number = 60 * 1000; // Cleanup every minute

  /**
   * Evaluates if a request from the given key is allowed under the specified tier.
   */
  check(key: string, tier: RateLimitTier = RATE_LIMIT_TIERS.DEFAULT): RateLimitResult {
    const now = Date.now();
    this.maybeCleanup(now);

    const windowStart = now - tier.windowMs;
    let record = this.store.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside the active sliding window
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    const count = record.timestamps.length;
    const allowed = count < tier.limit;

    if (allowed) {
      record.timestamps.push(now);
    }

    const remaining = Math.max(0, tier.limit - record.timestamps.length);
    const oldest = record.timestamps[0] || now;
    const resetMs = Math.max(0, oldest + tier.windowMs - now);

    return {
      allowed,
      limit: tier.limit,
      remaining,
      resetMs,
    };
  }

  /**
   * Reset rate limit state for a key (e.g. upon successful challenge).
   */
  reset(key: string) {
    this.store.delete(key);
  }

  private maybeCleanup(now: number) {
    if (now - this.lastCleanup > this.cleanupIntervalMs) {
      this.lastCleanup = now;
      const maxWindow = 5 * 60 * 1000; // 5 minutes max window
      const cutoff = now - maxWindow;

      for (const [key, record] of this.store.entries()) {
        record.timestamps = record.timestamps.filter((t) => t > cutoff);
        if (record.timestamps.length === 0) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * For testing purposes: clear all keys.
   */
  clear() {
    this.store.clear();
  }
}

export const rateLimiter = new RateLimiter();
