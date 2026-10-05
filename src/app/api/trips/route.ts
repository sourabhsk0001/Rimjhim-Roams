import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { createTrip, getUserTrips } from "@/lib/services/trip-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "trips_list_get",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trips = await getUserTrips(userId);
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "trips_list_post",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await createTrip(body, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, trip: result.data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create trip" },
      { status: 500 }
    );
  }
}
