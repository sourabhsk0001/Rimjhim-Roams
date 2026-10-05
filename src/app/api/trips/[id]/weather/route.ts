import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { weatherService } from "@/lib/services/weather-service";


/**
 * GET /api/trips/[id]/weather
 * Fetches real-time and forecast weather, snapshots, and itinerary conflict analysis for a trip.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripId = params.id;
    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const result = await weatherService.getTripWeather(tripId, userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to load weather" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load trip weather";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
