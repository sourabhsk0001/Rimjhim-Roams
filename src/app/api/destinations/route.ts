import { NextRequest, NextResponse } from "next/server";
import { getDestinations } from "@/lib/services/travel-data-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "destinations_list",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const climate = searchParams.get("climate") || undefined;

    const destinations = await getDestinations(search, climate);

    return NextResponse.json({
      data_status: "DEMO",
      count: destinations.length,
      destinations,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to fetch destinations",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
