import { NextRequest, NextResponse } from "next/server";
import { tourismAutocompleteService } from "@/lib/services/tourism-autocomplete-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "tourism_autocomplete",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 8;

    const suggestions = tourismAutocompleteService.getSuggestions(query, limit);

    return NextResponse.json({
      success: true,
      query,
      count: suggestions.length,
      suggestions,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate autocomplete suggestions",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
