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
 * GET /api/trips/[id]/packing
 * Retrieves the packing list and categorized summary for an authorized trip.
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
    if (!tripId) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    const result = await packingService.getTripPackingList(tripId, userId);
    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      summary: result.summary,
      items: result.items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load packing list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/trips/[id]/packing
 * Toggles an item's packed checkbox or checks/unchecks an entire category.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripId = params.id;
    const body = await req.json();

    if (body.action === "toggle_category" && body.category) {
      const result = await packingService.checkAllCategory(
        tripId,
        body.category,
        Boolean(body.packed),
        userId
      );
      if (!result.authorized) {
        return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
      }
      return NextResponse.json({ success: true });
    }

    if (!body.itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const result = await packingService.togglePackingItem(
      tripId,
      body.itemId,
      Boolean(body.packed),
      userId
    );

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, item: result.item });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update packing item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/trips/[id]/packing
 * Adds a custom user item to the packing list.
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
    const body = await req.json();

    if (!body.category || !body.item_name) {
      return NextResponse.json({ error: "Category and item_name are required" }, { status: 400 });
    }

    const result = await packingService.addCustomItem(
      tripId,
      {
        category: body.category,
        item_name: body.item_name,
        quantity: body.quantity,
        essential: body.essential,
        notes: body.notes,
      },
      userId
    );

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, item: result.item }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to add packing item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/trips/[id]/packing
 * Deletes an item from the packing list.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripId = params.id;
    const searchParams = req.nextUrl.searchParams;
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId query parameter is required" }, { status: 400 });
    }

    const result = await packingService.deletePackingItem(tripId, itemId, userId);
    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete packing item";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
