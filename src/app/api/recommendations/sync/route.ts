import { NextRequest, NextResponse } from "next/server";
import { recommendationEngineService } from "@/lib/services/recommendation-engine-service";

function resolveUserId(req: NextRequest): string {
  return (
    req.cookies.get("rr_demo_session")?.value ||
    req.headers.get("x-user-id") ||
    "demo-user-123"
  );
}

export async function POST(req: NextRequest) {
  try {
    const userId = resolveUserId(req);
    const syncResult = await recommendationEngineService.syncPreferencesFromSavedItineraries(
      userId
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
