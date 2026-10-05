/**
 * Production Security & Sanitization Utilities
 * Prevents information disclosure, credential leakage, internal path leakage,
 * and ensures test bypass headers cannot be exploited in production environments.
 */

/**
 * Returns true if the application is running in a live production environment.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Validates whether test-only bypass headers (e.g. x-test-user-id) are allowed.
 * Strictly returns false in production to prevent privilege escalation or auth bypass.
 */
export function allowTestBypassHeaders(): boolean {
  return !isProduction();
}

/**
 * Sanitizes error messages for user-facing API responses.
 * Neutralizes:
 * - Local file system paths (Windows C:\... and POSIX /var/..., /home/...)
 * - Database connection strings, SQL query text, table schemas
 * - Passwords, secret keys, bearer tokens, and JWT fragments
 * - Stack traces and raw internal error objects
 */
export function sanitizeErrorMessage(
  err: unknown,
  fallback: string = "An unexpected error occurred while processing your request."
): string {
  if (!err) return fallback;

  const rawMessage =
    typeof err === "string" ? err : err instanceof Error ? err.message : String(err);

  if (!rawMessage || typeof rawMessage !== "string") {
    return fallback;
  }

  // Known patterns of sensitive infrastructure details
  const sensitivePatterns: RegExp[] = [
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /bearer\s+[a-z0-9._-]+/i,
    /ey[a-zA-Z0-9_-]{20,}/, // JWT pattern
    /postgres:\/\//i,
    /supabase/i,
    /select\s+.*\s+from/i,
    /insert\s+into/i,
    /update\s+.*\s+set/i,
    /delete\s+from/i,
    /[a-zA-Z]:\\[^\s]+/i, // Windows absolute path
    /\/(?:Users|home|var|usr|etc|vercel|app)\/[^\s]+/i, // Unix absolute path
    /node_modules/i,
    /at\s+[a-zA-Z0-9_.]+\s+\(/i, // Stack trace frames
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(rawMessage)) {
      return fallback;
    }
  }

  // In production, limit error messages to concise, safe messages
  if (isProduction()) {
    if (rawMessage.length > 180 || rawMessage.includes("\n")) {
      return fallback;
    }
  }

  return rawMessage;
}
