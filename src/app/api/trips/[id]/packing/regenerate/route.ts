import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { packingService } from "@/lib/services/packing-service";


/**
 * POST /api/trips/[id]/packing/regenerate
 * Regenerates packing list based on the latest destination, duration, weather, and itinerary factors.
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
    const result = await packingService.regeneratePackingList(tripId, userId);

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    // Return the fresh summary
    const refreshed = await packingService.getTripPackingList(tripId, userId);
    return NextResponse.json({
      success: true,
      summary: refreshed.summary,
      items: refreshed.items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to regenerate packing list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
