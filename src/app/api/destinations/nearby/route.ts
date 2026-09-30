import { NextRequest, NextResponse } from "next/server";
import { findNearbyAttractions } from "@/lib/services/travel-data-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius") || "25";

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Latitude ('lat') and longitude ('lng') query parameters are required." },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = parseFloat(radiusStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "Invalid geographic coordinates provided." },
        { status: 400 }
      );
    }

    const nearbyAttractions = await findNearbyAttractions(lat, lng, radius);

    return NextResponse.json({
      data_status: "DEMO",
      center: { latitude: lat, longitude: lng },
      radius_km: radius,
      count: nearbyAttractions.length,
      attractions: nearbyAttractions,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to perform spatial search",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
