import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { weatherService } from "@/lib/services/weather-service";
import { WeatherConflictResolution } from "@/types/weather";


/**
 * POST /api/trips/[id]/weather/integrate
 * Runs weather conflict resolution against itinerary.
 * Supports { dryRun: true } for previewing recommendations,
 * or { dryRun: false } to apply and persist changes.
 */
export async function POST(
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

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun ?? false;
    const customResolutions = body.resolutions as WeatherConflictResolution[] | undefined;

    if (customResolutions && Array.isArray(customResolutions) && !dryRun) {
      const applied = await weatherService.applyWeatherResolutions(
        tripId,
        userId,
        customResolutions
      );
      return NextResponse.json({
        success: true,
        applied,
      });
    }

    const result = await weatherService.integrateWeatherWithItinerary(tripId, {
      dryRun,
      userId,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to integrate weather with itinerary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
