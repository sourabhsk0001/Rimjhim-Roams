import { NextRequest, NextResponse } from "next/server";
import { recommendationEngineService } from "@/lib/services/recommendation-engine-service";
import { requireAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "recommendations_get",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  const userId = auth.user.id;

  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 9;
    const seasonMonth = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : undefined;

    // Automatically sync and learn from latest saved itineraries
    await recommendationEngineService.syncPreferencesFromSavedItineraries(userId);

    const recommendations = recommendationEngineService.generatePersonalizedRecommendations(
      userId,
      { limit, seasonMonth }
    );

    return NextResponse.json({
      success: true,
      ...recommendations,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate personalized recommendations",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
