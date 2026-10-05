import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { bookingService } from "@/lib/services/booking-service";


/**
 * GET /api/trips/[id]/bookings
 * Retrieves all booking records and verification summary for an authorized trip.
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
    const result = await bookingService.listTripBookings(tripId, userId);

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      bookings: result.bookings,
      summary: result.summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load bookings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/trips/[id]/bookings
 * Creates a booking record with strict provider confirmation verification.
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

    if (!body.provider || !body.type || !body.date) {
      return NextResponse.json(
        { error: "provider, type, and date are required" },
        { status: 400 }
      );
    }

    const result = await bookingService.createBooking(
      tripId,
      userId,
      {
        provider: body.provider,
        booking_reference: body.booking_reference,
        type: body.type,
        date: body.date,
        time: body.time,
        price: body.price,
        currency: body.currency,
        status: body.status,
        notes: body.notes,
        document_id: body.document_id,
      }
    );

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, booking: result.booking }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create booking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
