import { NextRequest, NextResponse } from "next/server";
import { tourismAutocompleteService } from "@/lib/services/tourism-autocomplete-service";

export async function GET(req: NextRequest) {
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
