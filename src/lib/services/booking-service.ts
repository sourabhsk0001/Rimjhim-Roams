// ==============================================================================
// Phase 14: Booking Service
// Manages trip bookings (flights, trains, buses, hotels, taxis, activities, restaurants)
// Strict Invariant: Do NOT claim confirmation without actual provider confirmation.
// ==============================================================================

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { collaborationService } from "@/lib/services/collaboration-service";
import { formatCurrency } from "@/lib/budget/money";
import { memoryDocuments } from "@/lib/services/document-service";
import {
  TripBooking,
  BookingType,
  BookingStatus,
  CreateBookingInput,
  BookingsSummary,
} from "@/types/travel-management";

export const memoryBookings: Map<string, TripBooking> = new Map();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

export class BookingService {
  /**
   * Lists all bookings for an authorized trip.
   */
  async listTripBookings(
    tripId: string,
    userId: string
  ): Promise<{
    authorized: boolean;
    bookings?: TripBooking[];
    summary?: BookingsSummary;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role) {
      return {
        authorized: false,
        error: "Unauthorized: You do not have permission to view bookings for this trip.",
      };
    }

    let bookings: TripBooking[] = [];

    if (!isSupabaseLive()) {
      bookings = Array.from(memoryBookings.values()).filter((b) => b.trip_id === tripId);
    } else {
      try {
        const supabase = createServerSupabase() as any;
        const { data, error } = await supabase
          .from("trip_bookings")
          .select("*")
          .eq("trip_id", tripId)
          .order("date", { ascending: true })
          .order("time", { ascending: true, nullsFirst: false });

        if (error) {
          return { authorized: true, error: error.message };
        }

        bookings = ((data as any[]) || []).map((row) => ({
          ...row,
          is_provider_verified: row.status === "confirmed" && Boolean(row.booking_reference?.trim()),
        }));
      } catch (err: unknown) {
        return { authorized: true, error: err instanceof Error ? err.message : "Error loading bookings." };
      }
    }

    // Attach document name if document_id is present
    for (const b of bookings) {
      if (b.document_id && !b.document_name) {
        const doc = memoryDocuments.get(b.document_id);
        if (doc) b.document_name = doc.name;
      }
    }

    const summary = this.computeBookingsSummary(tripId, bookings);

    return {
      authorized: true,
      bookings,
      summary,
    };
  }

  /**
   * Creates a new booking record with strict confirmation validation.
   */
  async createBooking(
    tripId: string,
    userId: string,
    input: CreateBookingInput
  ): Promise<{
    authorized: boolean;
    booking?: TripBooking;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role || role === "viewer") {
      return {
        authorized: false,
        error: "Unauthorized: Viewers cannot create booking records.",
      };
    }

    const provider = (input.provider || "").trim();
    if (!provider) {
      return { authorized: true, error: "Provider name is required." };
    }

    const reference = (input.booking_reference || "").trim();

    // Strict Rule: Do not claim confirmation without actual provider confirmation.
    // If user attempts to mark as confirmed without a valid provider reference, downgrade to pending.
    let status: BookingStatus = input.status || "pending_confirmation";
    let isProviderVerified = false;

    if (status === "confirmed") {
      if (!reference) {
        // Enforce honest status
        status = "pending_confirmation";
        isProviderVerified = false;
      } else {
        isProviderVerified = true;
      }
    }

    const now = new Date().toISOString();
    const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Resolve document name if attached
    let documentName: string | undefined = undefined;
    if (input.document_id) {
      const doc = memoryDocuments.get(input.document_id);
      if (doc) documentName = doc.name;
    }

    const newBooking: TripBooking = {
      id: bookingId,
      trip_id: tripId,
      created_by: userId,
      provider,
      booking_reference: reference || undefined,
      type: input.type,
      date: input.date,
      time: input.time || undefined,
      price: Math.max(0, Number(input.price) || 0),
      currency: input.currency || "INR",
      status,
      notes: input.notes?.trim(),
      document_id: input.document_id || undefined,
      document_name: documentName,
      is_provider_verified: isProviderVerified,
      created_at: now,
      updated_at: now,
    };

    if (!isSupabaseLive()) {
      memoryBookings.set(newBooking.id, newBooking);
      return { authorized: true, booking: newBooking };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("trip_bookings")
        .insert({
          trip_id: tripId,
          created_by: userId,
          provider: newBooking.provider,
          booking_reference: newBooking.booking_reference,
          type: newBooking.type,
          date: newBooking.date,
          time: newBooking.time,
          price: newBooking.price,
          currency: newBooking.currency,
          status: newBooking.status,
          notes: newBooking.notes,
          document_id: newBooking.document_id,
        })
        .select()
        .single();

      if (error) {
        return { authorized: true, error: error.message };
      }

      const created = data as TripBooking;
      created.is_provider_verified = isProviderVerified;
      created.document_name = documentName;
      return { authorized: true, booking: created };
    } catch (err: unknown) {
      return { authorized: true, error: err instanceof Error ? err.message : "Error creating booking." };
    }
  }

  /**
   * Updates an existing booking record.
   */
  async updateBooking(
    tripId: string,
    bookingId: string,
    userId: string,
    updates: Partial<CreateBookingInput>
  ): Promise<{
    authorized: boolean;
    booking?: TripBooking;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role || role === "viewer") {
      return {
        authorized: false,
        error: "Unauthorized: Viewers cannot modify booking records.",
      };
    }

    if (!isSupabaseLive()) {
      const existing = memoryBookings.get(bookingId);
      if (!existing || existing.trip_id !== tripId) {
        return { authorized: true, error: "Booking record not found." };
      }

      if (updates.provider !== undefined) existing.provider = updates.provider.trim();
      if (updates.booking_reference !== undefined) existing.booking_reference = updates.booking_reference.trim() || undefined;
      if (updates.type !== undefined) existing.type = updates.type;
      if (updates.date !== undefined) existing.date = updates.date;
      if (updates.time !== undefined) existing.time = updates.time || undefined;
      if (updates.price !== undefined) existing.price = Math.max(0, Number(updates.price) || 0);
      if (updates.currency !== undefined) existing.currency = updates.currency;
      if (updates.notes !== undefined) existing.notes = updates.notes.trim();
      if (updates.document_id !== undefined) existing.document_id = updates.document_id || undefined;

      if (updates.status !== undefined) {
        if (updates.status === "confirmed" && !existing.booking_reference) {
          existing.status = "pending_confirmation";
        } else {
          existing.status = updates.status;
        }
      }

      existing.is_provider_verified = existing.status === "confirmed" && Boolean(existing.booking_reference);
      existing.updated_at = new Date().toISOString();

      memoryBookings.set(bookingId, existing);
      return { authorized: true, booking: existing };
    }

    try {
      const supabase = createServerSupabase() as any;

      // Check current reference if status set to confirmed
      const reference = updates.booking_reference !== undefined ? updates.booking_reference.trim() : undefined;
      let status = updates.status;
      if (status === "confirmed" && reference !== undefined && !reference) {
        status = "pending_confirmation";
      }

      const patch: any = { updated_at: new Date().toISOString() };
      if (updates.provider !== undefined) patch.provider = updates.provider.trim();
      if (reference !== undefined) patch.booking_reference = reference || null;
      if (updates.type !== undefined) patch.type = updates.type;
      if (updates.date !== undefined) patch.date = updates.date;
      if (updates.time !== undefined) patch.time = updates.time || null;
      if (updates.price !== undefined) patch.price = Math.max(0, Number(updates.price) || 0);
      if (updates.currency !== undefined) patch.currency = updates.currency;
      if (status !== undefined) patch.status = status;
      if (updates.notes !== undefined) patch.notes = updates.notes.trim();
      if (updates.document_id !== undefined) patch.document_id = updates.document_id || null;

      const { data, error } = await supabase
        .from("trip_bookings")
        .update(patch)
        .eq("id", bookingId)
        .eq("trip_id", tripId)
        .select()
        .single();

      if (error) return { authorized: true, error: error.message };

      const updated = data as TripBooking;
      updated.is_provider_verified = updated.status === "confirmed" && Boolean(updated.booking_reference);
      return { authorized: true, booking: updated };
    } catch (err: unknown) {
      return { authorized: true, error: err instanceof Error ? err.message : "Error updating booking." };
    }
  }

  /**
   * Deletes a booking record.
   */
  async deleteBooking(
    tripId: string,
    bookingId: string,
    userId: string
  ): Promise<{
    authorized: boolean;
    success: boolean;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role || role === "viewer") {
      return {
        authorized: false,
        success: false,
        error: "Unauthorized: Viewers cannot delete booking records.",
      };
    }

    if (!isSupabaseLive()) {
      const existing = memoryBookings.get(bookingId);
      if (existing && existing.trip_id === tripId) {
        memoryBookings.delete(bookingId);
      }
      return { authorized: true, success: true };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { error } = await supabase
        .from("trip_bookings")
        .delete()
        .eq("id", bookingId)
        .eq("trip_id", tripId);

      if (error) return { authorized: true, success: false, error: error.message };
      return { authorized: true, success: true };
    } catch (err: unknown) {
      return { authorized: true, success: false, error: err instanceof Error ? err.message : "Error deleting booking." };
    }
  }

  // ---------------------------------------------------------------------------
  // Internal Summary Computer
  // ---------------------------------------------------------------------------
  private computeBookingsSummary(tripId: string, bookings: TripBooking[]): BookingsSummary {
    const totalCount = bookings.length;
    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let totalCost = 0;

    const byTypeCount: Record<BookingType, number> = {
      flight: 0,
      train: 0,
      bus: 0,
      hotel: 0,
      taxi: 0,
      activity: 0,
      restaurant: 0,
    };

    for (const b of bookings) {
      if (b.status === "confirmed") confirmedCount++;
      else if (b.status === "cancelled") cancelledCount++;
      else pendingCount++;

      if (b.status !== "cancelled") {
        totalCost += Number(b.price) || 0;
      }

      if (byTypeCount[b.type] !== undefined) {
        byTypeCount[b.type]++;
      }
    }

    return {
      tripId,
      totalCount,
      confirmedCount,
      pendingCount,
      cancelledCount,
      totalCostFormatted: formatCurrency(totalCost, { currency: "INR" }),
      byTypeCount,
    };
  }
}

export const bookingService = new BookingService();
