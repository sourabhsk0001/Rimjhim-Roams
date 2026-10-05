import { NextRequest, NextResponse } from "next/server";
import { recommendationEngineService } from "@/lib/services/recommendation-engine-service";

function resolveUserId(req: NextRequest): string {
  return (
    req.cookies.get("rr_demo_session")?.value ||
    req.headers.get("x-user-id") ||
    "demo-user-123"
  );
}

export async function GET(req: NextRequest) {
  try {
    const userId = resolveUserId(req);
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
