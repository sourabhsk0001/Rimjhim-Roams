import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tripPlannerService } from "@/lib/services/trip-planner-service";

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
 * POST /api/trips/[id]/plan
 * Generates a complete deterministic travel plan connecting data, routing,
 * time intelligence, and budget engines.
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
    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    const plan = await tripPlannerService.planTrip(tripId, userId);
    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate complete trip plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/trips/[id]/plan
 * Retrieves cached or existing planned trip details.
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
    const existing = await tripPlannerService.getPlannedTrip(tripId);
    if (existing) {
      return NextResponse.json({ success: true, plan: existing });
    }

    // If not yet planned, generate on the fly
    const plan = await tripPlannerService.planTrip(tripId, userId);
    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load trip plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
