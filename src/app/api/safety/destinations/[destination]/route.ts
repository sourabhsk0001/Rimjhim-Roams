import { NextRequest, NextResponse } from "next/server";
import { safetyService } from "@/lib/services/safety-service";

/**
 * GET /api/safety/destinations/[destination]
 * Public lookup for source-backed destination safety records, emergency numbers, hospitals, and local rules.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { destination: string } }
) {
  try {
    const destination = decodeURIComponent(params.destination || "").trim();
    if (!destination) {
      return NextResponse.json({ error: "Destination name is required" }, { status: 400 });
    }

    const searchParams = req.nextUrl.searchParams;
    const latStr = searchParams.get("latitude");
    const lonStr = searchParams.get("longitude");

    let userCoords: { latitude: number; longitude: number } | undefined = undefined;
    if (latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      if (!isNaN(lat) && !isNaN(lon)) {
        userCoords = { latitude: lat, longitude: lon };
      }
    }

    const safetyCenter = await safetyService.getDestinationSafetyInfo(destination, userCoords);
    return NextResponse.json({
      success: true,
      safetyCenter,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load destination safety information";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
