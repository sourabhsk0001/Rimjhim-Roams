import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { emergencyModeService } from "@/lib/services/emergency-mode-service";
import { EmergencyFacilityType } from "@/types/emergency-mode";

/**
 * GET /api/trips/[id]/emergency
 * Query params:
 *   - latitude, longitude, accuracy (optional)
 *   - facilityType (optional: hospital | police | pharmacy | embassy | hotel)
 *   - facilityId (optional)
 * Returns authoritative decision-support emergency data, facility directories,
 * hotel address, emergency contacts, routing, and location share message.
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
    const facilityType = searchParams.get("facilityType") as EmergencyFacilityType | "hotel" | null;
    const facilityId = searchParams.get("facilityId");

    let userCoords: { latitude: number; longitude: number; accuracy?: number } | undefined = undefined;
    if (latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      const acc = accStr ? parseFloat(accStr) : undefined;
      if (!isNaN(lat) && !isNaN(lon)) {
        userCoords = { latitude: lat, longitude: lon, accuracy: acc };
      }
    }

    const result = await emergencyModeService.getEmergencyModeData(tripId, userId, {
      userCoords,
      targetFacilityType: facilityType || undefined,
      targetFacilityId: facilityId || undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load emergency mode data";
    const status = message.includes("unauthorized") || message.includes("Unauthorized")
      ? 403
      : message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * POST /api/trips/[id]/emergency
 * Body: {
 *   latitude?: number,
 *   longitude?: number,
 *   accuracy?: number,
 *   targetFacilityType?: "hospital" | "police" | "pharmacy" | "embassy" | "hotel",
 *   targetFacilityId?: string
 * }
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
    let userCoords: { latitude: number; longitude: number; accuracy?: number } | undefined = undefined;

    if (typeof body.latitude === "number" && typeof body.longitude === "number") {
      userCoords = {
        latitude: body.latitude,
        longitude: body.longitude,
        accuracy: typeof body.accuracy === "number" ? body.accuracy : undefined,
      };
    }

    const result = await emergencyModeService.getEmergencyModeData(tripId, userId, {
      userCoords,
      targetFacilityType: body.targetFacilityType,
      targetFacilityId: body.targetFacilityId,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process emergency request";
    const status = message.includes("unauthorized") || message.includes("Unauthorized")
      ? 403
      : message.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
