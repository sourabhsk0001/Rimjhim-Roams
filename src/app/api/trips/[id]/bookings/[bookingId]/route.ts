import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookingService } from "@/lib/services/booking-service";

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
 * PATCH /api/trips/[id]/bookings/[bookingId]
 * Updates a booking record with provider verification enforcement.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; bookingId: string } }
) {
  try {
    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId, bookingId } = params;
    const body = await req.json();

    const result = await bookingService.updateBooking(tripId, bookingId, userId, body);

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: result.booking });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/trips/[id]/bookings/[bookingId]
 * Deletes a booking record.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; bookingId: string } }
) {
  try {
    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId, bookingId } = params;
    const result = await bookingService.deleteBooking(tripId, bookingId, userId);

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
