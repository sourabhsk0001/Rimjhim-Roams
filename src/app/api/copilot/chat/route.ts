import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { copilotService } from "@/lib/services/copilot-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";
import { enforceGeminiQuota } from "@/lib/security/gemini-quota";

/**
 * POST /api/copilot/chat
 * Main conversational endpoint for TripWise AI Travel Copilot.
 * Ensures the model selects deterministic backend tools and does not do authoritative math.
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, {
      prefix: "copilot_chat",
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const quotaResponse = enforceGeminiQuota(req, userId);
    if (quotaResponse) return quotaResponse;

    const body = await req.json().catch(() => ({}));
    const { message, tripId, history } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const response = await copilotService.processMessage(
      {
        message: message.trim(),
        tripId: typeof tripId === "string" ? tripId : undefined,
        history: Array.isArray(history) ? history : undefined,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal copilot error";
    const status = message.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
