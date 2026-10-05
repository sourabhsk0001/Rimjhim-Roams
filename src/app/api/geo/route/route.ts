import { NextRequest, NextResponse } from "next/server";
import { calculateRoute, RouteMode, GeoCoordinate } from "@/lib/geo/routing";
import { enforceRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeErrorMessage } from "@/lib/security/sanitizer";

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "geo_route",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { waypoints, mode = "driving" } = body as {
      waypoints: GeoCoordinate[];
      mode?: RouteMode;
    };

    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return NextResponse.json(
        { error: "At least two geographic waypoints are required." },
        { status: 400 }
      );
    }

    const route = await calculateRoute(waypoints, mode);

    return NextResponse.json({
      success: route.success,
      route,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to calculate route",
        details: sanitizeErrorMessage(err),
      },
      { status: 500 }
    );
  }
}
