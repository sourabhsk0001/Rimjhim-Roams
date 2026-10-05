import { NextRequest, NextResponse } from "next/server";
import { allowTestBypassHeaders } from "@/lib/security/sanitizer";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

class TokenBucketRateLimiter {
  private buckets = new Map<string, BucketEntry>();

  /**
   * Evaluates if a request from a specific identifier is within allowed rate limits.
   */
  check(key: string, maxRequests: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = this.buckets.get(key);

    if (!entry || now > entry.resetAt) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        resetSeconds: Math.ceil((now + windowMs) / 1000),
      };
    }

    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        resetSeconds: Math.ceil(entry.resetAt / 1000),
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      resetSeconds: Math.ceil(entry.resetAt / 1000),
    };
  }

  /**
   * Resets rate limit for a specific key (useful for tests and elevated bypass).
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clears all tracked rate limits.
   */
  clear(): void {
    this.buckets.clear();
  }
}

// Global in-memory rate limiter singleton
export const globalRateLimiter = new TokenBucketRateLimiter();

/**
 * Standard client identifier extraction from HTTP request headers.
 */
export function extractClientIdentifier(req: NextRequest, prefix = "global"): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";
  const userCookie = req.cookies.get("rr_demo_session")?.value || "";
  return `${prefix}:${ip}:${userCookie}`;
}

/**
 * Middleware helper: checks rate limit and returns 429 response if exceeded.
 * Returns null if allowed, allowing route handler to continue execution.
 */
export function enforceRateLimit(
  req: NextRequest,
  options: {
    prefix: string;
    maxRequests: number;
    windowMs: number;
  }
): NextResponse | null {
  // In test runners or internal development with mock IP bypass, allow if configured (DISABLED in production)
  if (allowTestBypassHeaders()) {
    const bypass = req.headers.get("x-test-bypass-ratelimit");
    if (bypass === "true") {
      return null;
    }
  }

  const identifier = extractClientIdentifier(req, options.prefix);
  const result = globalRateLimiter.check(identifier, options.maxRequests, options.windowMs);

  if (!result.allowed) {
    const retryAfter = Math.max(1, result.resetSeconds - Math.floor(Date.now() / 1000));
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Too many requests to ${options.prefix}. Please retry in ${retryAfter} seconds.`,
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetSeconds),
        },
      }
    );
  }

  return null;
}
