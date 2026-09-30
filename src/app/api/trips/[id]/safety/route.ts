import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safetyService } from "@/lib/services/safety-service";

async function getActiveUserId(req: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isMock = !supabaseUrl || supabaseUrl.includes("mock-project");

  if (isMock) {
    return req.cookies.get("rr_demo_session")?.value || "demo-user-123";
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? user.id : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/trips/[id]/safety
 * Returns source-backed safety data, nearest hospitals/police, and structured SOS card for an authorized trip.
 * Optional query params: latitude, longitude (provided only after explicit user permission).
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

    let userCoords: { latitude: number; longitude: number } | undefined = undefined;
    if (latStr && lonStr) {
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      if (!isNaN(lat) && !isNaN(lon)) {
        userCoords = { latitude: lat, longitude: lon };
      }
    }

    const result = await safetyService.getTripSafetyCenter(tripId, userId, userCoords);
    if (!result.authorized) {
      return NextResponse.json(
        { error: result.error || "Unauthorized access to trip safety data" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      safetyCenter: result.safetyCenter,
      emergencyCard: result.emergencyCard,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load trip safety data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
