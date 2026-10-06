import { NextRequest, NextResponse } from "next/server";
import { placeComfortService } from "@/lib/services/place-comfort-service";

/**
 * GET /api/safety/place-comfort
 * Query params:
 *   - placeName (required)
 *   - placeId (optional)
 *   - destination (optional)
 *   - category (optional)
 *   - latitude (optional)
 *   - longitude (optional)
 *
 * Returns transparent Travel Comfort & Safety Profile with 5 public signals,
 * "Better time to visit" window, and verified sources.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const placeName = searchParams.get("placeName");
    const placeId = searchParams.get("placeId") || undefined;
    const destination = searchParams.get("destination") || undefined;
    const category = searchParams.get("category") || undefined;
    const latStr = searchParams.get("latitude");
    const lonStr = searchParams.get("longitude");

    if (!placeName) {
      return NextResponse.json(
        { error: "Query parameter 'placeName' is required." },
        { status: 400 }
      );
    }

    const latitude = latStr ? parseFloat(latStr) : undefined;
    const longitude = lonStr ? parseFloat(lonStr) : undefined;

    const profile = placeComfortService.getPlaceComfortProfile({
      placeId,
      placeName,
      destination,
      category,
      latitude: !isNaN(latitude ?? NaN) ? latitude : undefined,
      longitude: !isNaN(longitude ?? NaN) ? longitude : undefined,
    });

    return NextResponse.json(profile);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load place comfort profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
