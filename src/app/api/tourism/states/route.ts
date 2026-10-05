import { NextRequest, NextResponse } from "next/server";
import { indiaTourismService } from "@/lib/services/india-tourism-service";
import { IndiaZone } from "@/types/india-tourism";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "tourism_states",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(req.url);
    const zone = searchParams.get("zone") as IndiaZone | null;
    const query = searchParams.get("query")?.toLowerCase().trim();

    let states = indiaTourismService.getAllStatesAndUTs();

    if (zone) {
      states = states.filter((s) => s.zone.toLowerCase() === zone.toLowerCase());
    }

    if (query) {
      states = states.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.capital.toLowerCase().includes(query) ||
          s.primary_tourism_themes.some((t) => t.toLowerCase().includes(query)) ||
          s.top_destinations.some((d) => d.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({
      success: true,
      total: states.length,
      data_status: "VERIFIED_OFFICIAL",
      sources: {
        administrative: "GeoNames & Survey of India",
        officialTourism: "Ministry of Tourism (MoT) & Incredible India",
        spatialThematic: "NATMO",
      },
      states_and_uts: states,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch India states and union territories",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
