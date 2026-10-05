import { NextRequest, NextResponse } from "next/server";

export interface UserQuotaDetails {
  userId: string;
  limit: number;
  used: number;
  remaining: number;
}

export interface ServerQuotaDetails {
  limit: number;
  used: number;
  remaining: number;
}

export interface GeminiQuotaCheckResult {
  allowed: boolean;
  code?: "USER_DAILY_QUOTA_EXCEEDED" | "SERVER_DAILY_QUOTA_EXCEEDED";
  reason?: "student_project_free_tier" | "server_daily_quota_exceeded";
  message?: string;
  user: UserQuotaDetails;
  server: ServerQuotaDetails;
  resetAt: string;
  retryAfterSeconds: number;
}

export interface GeminiQuotaStatus {
  date: string;
  user?: UserQuotaDetails;
  server: ServerQuotaDetails;
  resetAt: string;
  retryAfterSeconds: number;
  explanation: {
    title: string;
    studentProjectNotice: string;
    fairUsePolicy: string;
    deterministicFallbackNotice: string;
  };
}

/**
 * Calculates current UTC calendar day string: "YYYY-MM-DD"
 */
export function getCurrentUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculates exact timestamp of next midnight 00:00:00 UTC and remaining seconds.
 */
export function getNextMidnightUtc(): { date: Date; iso: string; secondsUntilReset: number } {
  const now = new Date();
  const nextMidnight = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  const secondsUntilReset = Math.max(1, Math.ceil((nextMidnight.getTime() - now.getTime()) / 1000));
  return {
    date: nextMidnight,
    iso: nextMidnight.toISOString(),
    secondsUntilReset,
  };
}

/**
 * Detailed student-project explanatory messages explaining why quotas are enforced.
 */
function buildUserQuotaExceededMessage(userLimit: number, resetIso: string, secondsUntil: number): string {
  const hours = Math.floor(secondsUntil / 3600);
  const minutes = Math.floor((secondsUntil % 3600) / 60);
  const timeFormatted = `${hours}h ${minutes}m`;

  return (
    `Daily Gemini AI request limit reached (${userLimit}/${userLimit} requests used today). ` +
    `Rimjhim Roams is an academic student project operating strictly on Google Gemini's Free Tier API. ` +
    `To ensure fair and reliable access for all student evaluators, recruiters, and travelers without incurring paid cloud billing costs, ` +
    `individual accounts are provided ${userLimit} AI generation calls per day. ` +
    `Your quota will automatically reset at midnight UTC (${resetIso}, in approx ${timeFormatted}). ` +
    `In the meantime, all deterministic planning engines (OSRM routing, Open-Meteo weather forecasts, NATMO exploration, and zero-drift budget calculation) remain 100% available without limits. ` +
    `Thank you for evaluating our student project!`
  );
}

function buildServerQuotaExceededMessage(serverLimit: number, resetIso: string, secondsUntil: number): string {
  const hours = Math.floor(secondsUntil / 3600);
  const minutes = Math.floor((secondsUntil % 3600) / 60);
  const timeFormatted = `${hours}h ${minutes}m`;

  return (
    `Server-wide daily Gemini AI quota reached (${serverLimit}/${serverLimit} requests used today). ` +
    `Rimjhim Roams is an academic student project operating under Google Gemini Free-Tier constraints (1,500 daily requests ceiling). ` +
    `To prevent total service suspension and stay within free non-commercial thresholds, new generative AI queries are temporarily paused until midnight UTC (${resetIso}, in approx ${timeFormatted}). ` +
    `All saved itineraries, official tourism destinations, interactive maps, and deterministic financial calculations continue to function normally without restriction. ` +
    `We appreciate your patience and support for our student project!`
  );
}

/**
 * In-memory Daily Quota Manager for Google Gemini API.
 * Tracks both server-wide daily requests and per-user daily requests.
 * Automatically rolls over when calendar day changes.
 */
export class GeminiDailyQuotaManager {
  private currentDate: string = getCurrentUtcDateString();
  private serverCallCount: number = 0;
  private userCallCounts = new Map<string, number>();

  // Configurable limits (can be overridden via environment variables or testing helpers)
  private serverLimit: number = Number(process.env.GEMINI_DAILY_SERVER_LIMIT) || 1000;
  private userLimit: number = Number(process.env.GEMINI_DAILY_USER_LIMIT) || 20;

  constructor() {
    this.ensureDateRollover();
  }

  /**
   * Ensures internal counters roll over when UTC date changes.
   */
  private ensureDateRollover(): void {
    const today = getCurrentUtcDateString();
    if (this.currentDate !== today) {
      this.currentDate = today;
      this.serverCallCount = 0;
      this.userCallCounts.clear();
    }
  }

  /**
   * Evaluates if a Gemini call is allowed without consuming quota.
   */
  checkQuota(userId: string): GeminiQuotaCheckResult {
    this.ensureDateRollover();
    const { iso: resetAt, secondsUntilReset: retryAfterSeconds } = getNextMidnightUtc();

    const normalizedUserId = userId || "anonymous-traveler";
    const userUsed = this.userCallCounts.get(normalizedUserId) || 0;
    const serverUsed = this.serverCallCount;

    // 1. Check Server-Wide Quota
    if (serverUsed >= this.serverLimit) {
      return {
        allowed: false,
        code: "SERVER_DAILY_QUOTA_EXCEEDED",
        reason: "server_daily_quota_exceeded",
        message: buildServerQuotaExceededMessage(this.serverLimit, resetAt, retryAfterSeconds),
        user: {
          userId: normalizedUserId,
          limit: this.userLimit,
          used: userUsed,
          remaining: Math.max(0, this.userLimit - userUsed),
        },
        server: {
          limit: this.serverLimit,
          used: serverUsed,
          remaining: 0,
        },
        resetAt,
        retryAfterSeconds,
      };
    }

    // 2. Check Per-User Quota
    if (userUsed >= this.userLimit) {
      return {
        allowed: false,
        code: "USER_DAILY_QUOTA_EXCEEDED",
        reason: "student_project_free_tier",
        message: buildUserQuotaExceededMessage(this.userLimit, resetAt, retryAfterSeconds),
        user: {
          userId: normalizedUserId,
          limit: this.userLimit,
          used: userUsed,
          remaining: 0,
        },
        server: {
          limit: this.serverLimit,
          used: serverUsed,
          remaining: Math.max(0, this.serverLimit - serverUsed),
        },
        resetAt,
        retryAfterSeconds,
      };
    }

    return {
      allowed: true,
      user: {
        userId: normalizedUserId,
        limit: this.userLimit,
        used: userUsed,
        remaining: this.userLimit - userUsed,
      },
      server: {
        limit: this.serverLimit,
        used: serverUsed,
        remaining: this.serverLimit - serverUsed,
      },
      resetAt,
      retryAfterSeconds,
    };
  }

  /**
   * Atomically evaluates and consumes 1 Gemini call quota for the user and server.
   */
  consumeQuota(userId: string): GeminiQuotaCheckResult {
    const check = this.checkQuota(userId);
    if (!check.allowed) {
      return check;
    }

    const normalizedUserId = userId || "anonymous-traveler";
    const newUserUsed = (this.userCallCounts.get(normalizedUserId) || 0) + 1;
    this.userCallCounts.set(normalizedUserId, newUserUsed);
    this.serverCallCount += 1;

    return {
      allowed: true,
      user: {
        userId: normalizedUserId,
        limit: this.userLimit,
        used: newUserUsed,
        remaining: this.userLimit - newUserUsed,
      },
      server: {
        limit: this.serverLimit,
        used: this.serverCallCount,
        remaining: this.serverLimit - this.serverCallCount,
      },
      resetAt: check.resetAt,
      retryAfterSeconds: check.retryAfterSeconds,
    };
  }

  /**
   * Returns current quota status and student-project reasoning for inspection.
   */
  getQuotaStatus(userId?: string): GeminiQuotaStatus {
    this.ensureDateRollover();
    const { iso: resetAt, secondsUntilReset: retryAfterSeconds } = getNextMidnightUtc();

    const normalizedUserId = userId || undefined;
    const userUsed = normalizedUserId ? this.userCallCounts.get(normalizedUserId) || 0 : undefined;

    return {
      date: this.currentDate,
      user: normalizedUserId
        ? {
            userId: normalizedUserId,
            limit: this.userLimit,
            used: userUsed || 0,
            remaining: Math.max(0, this.userLimit - (userUsed || 0)),
          }
        : undefined,
      server: {
        limit: this.serverLimit,
        used: this.serverCallCount,
        remaining: Math.max(0, this.serverLimit - this.serverCallCount),
      },
      resetAt,
      retryAfterSeconds,
      explanation: {
        title: "Rimjhim Roams — Student Project Free-Tier AI Quota Policy",
        studentProjectNotice:
          "Rimjhim Roams is an academic student project engineered for intelligent travel planning education. All AI capabilities run strictly on the free tier of the Google Gemini API (gemini-1.5-flash).",
        fairUsePolicy:
          `To maintain equitable access for all student evaluators, recruiters, and travelers without incurring paid cloud billing costs, each account receives ${this.userLimit} Gemini requests per day, within a server-wide ceiling of ${this.serverLimit} requests per day.`,
        deterministicFallbackNotice:
          "When daily AI quota is exhausted, all deterministic engines (OSRM routing, Open-Meteo forecasts, NATMO exploration, and zero-drift budget calculation) remain 100% available without limits.",
      },
    };
  }

  /**
   * Resets internal counters. Intended for automated testing and administrative resets.
   */
  resetQuotaForTesting(date?: string): void {
    this.currentDate = date || getCurrentUtcDateString();
    this.serverCallCount = 0;
    this.userCallCounts.clear();
  }

  /**
   * Adjusts daily limits dynamically for testing corner cases (e.g. user limit of 2).
   */
  setLimitsForTesting(limits: { userLimit?: number; serverLimit?: number }): void {
    if (typeof limits.userLimit === "number") this.userLimit = limits.userLimit;
    if (typeof limits.serverLimit === "number") this.serverLimit = limits.serverLimit;
  }

  /**
   * Restores limits to environment defaults.
   */
  restoreDefaultLimits(): void {
    this.serverLimit = Number(process.env.GEMINI_DAILY_SERVER_LIMIT) || 1000;
    this.userLimit = Number(process.env.GEMINI_DAILY_USER_LIMIT) || 20;
  }
}

// Global Singleton Instance
export const geminiQuotaManager = new GeminiDailyQuotaManager();

/**
 * Route Handler Middleware helper:
 * Verifies daily Gemini quota for the given user and server.
 * Returns null if allowed (or test bypass present).
 * Returns HTTP 429 response with adequate student project explanation if exceeded.
 */
export function enforceGeminiQuota(
  req: NextRequest,
  userId: string,
  options: { consume?: boolean } = { consume: true }
): NextResponse | null {
  // Test bypass check
  const bypass =
    req.headers.get("x-bypass-gemini-quota") === "true" ||
    req.headers.get("x-test-bypass-quota") === "true";

  if (bypass) {
    return null;
  }

  const result = options.consume
    ? geminiQuotaManager.consumeQuota(userId)
    : geminiQuotaManager.checkQuota(userId);

  if (!result.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: result.message,
        code: result.code,
        reason: result.reason,
        message: result.message,
        details: {
          user: result.user,
          server: result.server,
          resetAt: result.resetAt,
          retryAfterSeconds: result.retryAfterSeconds,
        },
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfterSeconds),
          "X-Gemini-User-Limit": String(result.user.limit),
          "X-Gemini-User-Used": String(result.user.used),
          "X-Gemini-User-Remaining": String(result.user.remaining),
          "X-Gemini-Server-Limit": String(result.server.limit),
          "X-Gemini-Server-Used": String(result.server.used),
          "X-Gemini-Server-Remaining": String(result.server.remaining),
          "X-Gemini-Reset": result.resetAt,
        },
      }
    );
  }

  return null;
}
