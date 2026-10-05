import { NextRequest, NextResponse } from "next/server";
import { indiaTourismService } from "@/lib/services/india-tourism-service";
import { IndiaZone, TourismCategory } from "@/types/india-tourism";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radiusKm");
    const category = searchParams.get("category") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    // Spatial radius search
    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const radiusKm = radiusStr ? parseFloat(radiusStr) : 50;

      if (isNaN(lat) || isNaN(lng)) {
        return NextResponse.json(
          { success: false, error: "Invalid latitude or longitude format" },
          { status: 400 }
        );
      }

      const nearby = indiaTourismService.getNearbyLocations(lat, lng, radiusKm, limit, category);

      return NextResponse.json({
        success: true,
        type: "spatial_radius",
        center: { lat, lng },
        radius_km: radiusKm,
        count: nearby.length,
        locations: nearby,
      });
    }

    // Keyword & attribute filter search
    const query = searchParams.get("query") || undefined;
    const state = searchParams.get("state") || undefined;
    const district = searchParams.get("district") || undefined;
    const zone = (searchParams.get("zone") as IndiaZone) || undefined;
    const tag = searchParams.get("tag") || undefined;
    const maxEntryFeeStr = searchParams.get("maxEntryFee");
    const maxEntryFee = maxEntryFeeStr ? parseFloat(maxEntryFeeStr) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : 0;

    const result = indiaTourismService.searchLocations({
      query,
      state,
      district,
      category: category as TourismCategory,
      zone,
      tag,
      maxEntryFee,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      type: "knowledge_base_search",
      total: result.total,
      count: result.locations.length,
      offset,
      limit,
      state_summary: result.stateSummary,
      data_attribution: {
        primary: "Ministry of Tourism (Incredible India)",
        thematic_mapping: "NATMO",
        geo_coordinates: "OpenStreetMap",
        administrative_hierarchy: "GeoNames",
      },
      locations: result.locations,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to query India Tourism Knowledge Base",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.recommendItinerary === true) {
      const recommendation = indiaTourismService.recommendForItinerary({
        state: body.state,
        district: body.district,
        category: body.category,
        maxDays: body.days || 3,
        maxBudgetInr: body.maxBudgetInr,
      });

      return NextResponse.json({
        success: true,
        type: "itinerary_recommendation",
        recommendation,
      });
    }

    // Batch search or advanced query
    const result = indiaTourismService.searchLocations({
      query: body.query,
      state: body.state,
      district: body.district,
      category: body.category,
      zone: body.zone,
      tag: body.tag,
      maxEntryFee: body.maxEntryFee,
      limit: body.limit || 50,
      offset: body.offset || 0,
    });

    return NextResponse.json({
      success: true,
      total: result.total,
      count: result.locations.length,
      state_summary: result.stateSummary,
      locations: result.locations,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process advanced tourism query",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
