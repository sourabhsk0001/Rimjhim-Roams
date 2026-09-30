import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { packingService } from "@/lib/services/packing-service";

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
