import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { lostModeService } from "@/lib/services/lost-mode-service";

/**
 * GET /api/trips/[id]/lost-mode
 * Query params: latitude, longitude, accuracy (optional)
 * Returns live recovery navigation, planned stop deviation, walking/driving routes,
 * nearby safe public havens, and conversational AI guidance.
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

    const searchParams = req.nextUrl.searchParams;
    const latStr = searchParams.get("latitude");
    const lonStr = searchParams.get("longitude");
    const accStr = searchParams.get("accuracy");

    let userCoords: { latitude: number; longitude: number; accuracy?: number } | undefined = undefined;
    if (latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      const acc = accStr ? parseFloat(accStr) : undefined;
      if (!isNaN(lat) && !isNaN(lon)) {
        userCoords = { latitude: lat, longitude: lon, accuracy: acc };
      }
    }

    const result = await lostModeService.calculateLostRecovery(tripId, userId, userCoords);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate recovery navigation";
    const status = message.includes("Unauthorized") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST /api/trips/[id]/lost-mode
 * Body: { latitude?: number, longitude?: number, accuracy?: number }
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

    let body: { latitude?: number; longitude?: number; accuracy?: number } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable
    }

    let userCoords: { latitude: number; longitude: number; accuracy?: number } | undefined = undefined;
    if (body.latitude !== undefined && body.longitude !== undefined) {
      if (!isNaN(body.latitude) && !isNaN(body.longitude)) {
        userCoords = {
          latitude: body.latitude,
          longitude: body.longitude,
          accuracy: body.accuracy,
        };
      }
    }

    const result = await lostModeService.calculateLostRecovery(tripId, userId, userCoords);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to calculate recovery navigation";
    const status = message.includes("Unauthorized") ? 403 : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
