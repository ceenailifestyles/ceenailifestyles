import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limit store cached on globalThis with periodic cleanup
const globalForRateLimit = globalThis as unknown as {
  __rateLimitStore?: Map<string, RateLimitEntry>;
  __rateLimitLastCleanup?: number;
};

const store = globalForRateLimit.__rateLimitStore ?? new Map<string, RateLimitEntry>();
globalForRateLimit.__rateLimitStore = store;

const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
let lastCleanup = globalForRateLimit.__rateLimitLastCleanup ?? Date.now();
globalForRateLimit.__rateLimitLastCleanup = lastCleanup;

function cleanupExpired(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS && store.size < 10000) {
    return;
  }
  lastCleanup = now;
  globalForRateLimit.__rateLimitLastCleanup = lastCleanup;

  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Extracts client IP from x-forwarded-for (first value) or fallback headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Checks and increments rate limit for a given key within windowMs
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (entry.count < limit) {
    entry.count += 1;
    return {
      success: true,
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  return {
    success: false,
    remaining: 0,
    resetAt: entry.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

/**
 * Non-incrementing check to see if an IP or IP+email is currently locked out
 */
export function checkRateLimit(
  key: string,
  limit: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupExpired(now);

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Records a failed attempt for login routes
 */
export function recordFailedAttempt(
  key: string,
  windowMs: number
): { count: number; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupExpired(now);

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      count: 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  entry.count += 1;
  return {
    count: entry.count,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

/**
 * Resets/clears a rate limit key (e.g. on successful login)
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Generates a standard 429 response matching the application's JSON error shape
 */
export function createRateLimitResponse(
  retryAfterSeconds: number,
  message = "Too many requests. Please try again later."
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
      },
    }
  );
}

