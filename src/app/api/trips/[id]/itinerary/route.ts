import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTripItineraries,
  getItineraryDay,
  optimizeItineraryDay,
  addItineraryItem,
  deleteItineraryItem,
} from "@/lib/services/itinerary-service";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dayParam = searchParams.get("day");

  if (dayParam) {
    const dayNumber = parseInt(dayParam, 10);
    const dayRes = await getItineraryDay(params.id, dayNumber, userId);
    if (!dayRes.success || !dayRes.day) {
      return NextResponse.json(
        { error: dayRes.error || "Day not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ day: dayRes.day, validation: dayRes.validation });
  }

  const allRes = await getTripItineraries(params.id, userId);
  if (!allRes.success || !allRes.days) {
    return NextResponse.json(
      { error: allRes.error || "Failed to load itineraries" },
      { status: 404 }
    );
  }

  return NextResponse.json({ days: allRes.days });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check if this is an "optimize" request
    if (body.action === "optimize") {
      const dayNumber = body.dayNumber || 1;
      const optRes = await optimizeItineraryDay(params.id, dayNumber, userId);
      if (!optRes.success || !optRes.result) {
        return NextResponse.json(
          { error: optRes.error || "Failed to optimize day schedule" },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, result: optRes.result });
    }

    // Otherwise add new itinerary item
    const { dayNumber, item } = body;
    const addRes = await addItineraryItem(params.id, dayNumber || 1, userId, item);

    if (!addRes.success || !addRes.item) {
      return NextResponse.json(
        { error: addRes.error || "Failed to add item" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, item: addRes.item }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId query parameter is required" },
        { status: 400 }
      );
    }

    const delRes = await deleteItineraryItem(params.id, itemId, userId);
    if (!delRes.success) {
      return NextResponse.json({ error: delRes.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete item" },
      { status: 400 }
    );
  }
}
