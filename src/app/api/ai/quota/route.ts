import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { geminiQuotaManager } from "@/lib/security/gemini-quota";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

/**
 * GET /api/ai/quota
 * Returns current Gemini API daily quota usage, remaining limits, reset time,
 * and educational explanation of student project free-tier constraints.
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, {
      prefix: "ai_quota",
      maxRequests: 60,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const userId = await getActiveUserId(req);
    const status = geminiQuotaManager.getQuotaStatus(userId || undefined);

    return NextResponse.json({
      success: true,
      quota: status,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to retrieve AI quota";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
