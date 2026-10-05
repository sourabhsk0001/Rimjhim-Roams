import { NextRequest, NextResponse } from "next/server";
import { recommendationEngineService } from "@/lib/services/recommendation-engine-service";
import { requireAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "sync_preferences",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const syncResult = await recommendationEngineService.syncPreferencesFromSavedItineraries(
      auth.user.id
    );

    return NextResponse.json({
      message: `Analyzed ${syncResult.tripsAnalyzed} trips and ${syncResult.itinerariesAnalyzed} itinerary days.`,
      ...syncResult,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync preferences from saved itineraries",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
