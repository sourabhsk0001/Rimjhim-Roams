import {
  createClient as createServerSupabase,
  isTableMissingError,
  isSupabaseLive,
} from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { TripInputData, validateTripInput } from "@/lib/validation/trip";
import { memoryTripMembers } from "./collaboration-service";

export type TripRow = Database["public"]["Tables"]["trips"]["Row"];

// Fallback in-memory store for local testing without active Supabase credentials or unmigrated DB
export const memoryTrips: Map<string, TripRow> =
  (globalThis as unknown as { __memoryTrips?: Map<string, TripRow> }).__memoryTrips ||
  new Map<string, TripRow>();
(globalThis as unknown as { __memoryTrips?: Map<string, TripRow> }).__memoryTrips = memoryTrips;

export async function createTrip(
  input: TripInputData,
  userId: string
): Promise<{ success: boolean; data?: TripRow; error?: string }> {
  const validation = validateTripInput(input);
  if (!validation.valid || !validation.sanitized) {
    const errorMsg = Object.values(validation.errors).join("; ");
    return { success: false, error: errorMsg };
  }

  const payload = {
    ...validation.sanitized,
    user_id: userId,
    status: "planning" as const,
  };

  const createMemoryFallbackTrip = () => {
    const id = `trip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newTrip: TripRow = {
      id,
      ...payload,
      preferences: payload.preferences as unknown as TripRow["preferences"],
      created_at: now,
      updated_at: now,
    };
    memoryTrips.set(id, newTrip);
    return newTrip;
  };

  if (!isSupabaseLive()) {
    return { success: true, data: createMemoryFallbackTrip() };
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await (supabase.from("trips") as any)
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        console.warn(
          `[trip-service] Supabase 'trips' table not found in schema cache (${error.message}). Saving to memory store. Tip: execute 'supabase/migrations/20241001000000_initial_schema.sql' in Supabase SQL Editor.`
        );
        const fallbackTrip = createMemoryFallbackTrip();
        return { success: true, data: fallbackTrip };
      }
      return { success: false, error: error.message };
    }
    return { success: true, data: data as unknown as TripRow };
  } catch (err: unknown) {
    console.warn(
      "[trip-service] Supabase query threw, falling back to local memory store:",
      err instanceof Error ? err.message : err
    );
    const fallbackTrip = createMemoryFallbackTrip();
    return { success: true, data: fallbackTrip };
  }
}

export async function getUserTrips(userId: string): Promise<{
  upcoming: TripRow[];
  previous: TripRow[];
}> {
  const today = new Date().toISOString().split("T")[0];

  const getMemoryTripsForUser = () => {
    const memberTripIds = new Set(
      Array.from(memoryTripMembers.values())
        .filter((m) => m.user_id === userId)
        .map((m) => m.trip_id)
    );
    const userTrips = Array.from(memoryTrips.values()).filter(
      (t) => t.user_id === userId || memberTripIds.has(t.id)
    );
    const upcoming = userTrips
      .filter((t) => t.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const previous = userTrips
      .filter((t) => t.start_date < today)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    return { upcoming, previous };
  };

  if (!isSupabaseLive()) {
    return getMemoryTripsForUser();
  }

  try {
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("start_date", { ascending: true });

    if (error || !data) {
      return getMemoryTripsForUser();
    }

    const allTrips = (data as unknown as TripRow[]) || [];
    const memoryResult = getMemoryTripsForUser();
    const seenIds = new Set(allTrips.map((t) => t.id));
    for (const memTrip of [...memoryResult.upcoming, ...memoryResult.previous]) {
      if (!seenIds.has(memTrip.id)) {
        allTrips.push(memTrip);
        seenIds.add(memTrip.id);
      }
    }

    const upcoming = allTrips
      .filter((t) => t.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const previous = allTrips
      .filter((t) => t.start_date < today)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));

    return { upcoming, previous };
  } catch {
    return getMemoryTripsForUser();
  }
}

export async function getTripById(
  tripId: string,
  userId: string
): Promise<{ trip: TripRow | null; isAuthorized: boolean }> {
  const getMemoryTrip = () => {
    const trip = memoryTrips.get(tripId) || null;
    if (!trip) return { trip: null, isAuthorized: false };
    const isOwner = trip.user_id === userId;
    const isMember =
      isOwner ||
      Array.from(memoryTripMembers.values()).some(
        (m) => m.trip_id === tripId && m.user_id === userId
      );
    return { trip: isMember ? trip : null, isAuthorized: isMember };
  };

  if (!isSupabaseLive()) {
    return getMemoryTrip();
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (error || !data) {
      return getMemoryTrip();
    }

    // Handled by RLS policies
    return { trip: data as unknown as TripRow, isAuthorized: true };
  } catch {
    return getMemoryTrip();
  }
}

export async function deleteTrip(
  tripId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const deleteFromMemory = () => {
    const trip = memoryTrips.get(tripId);
    if (!trip || trip.user_id !== userId) {
      return { success: false, error: "Unauthorized or trip not found." };
    }
    memoryTrips.delete(tripId);
    return { success: true };
  };

  if (!isSupabaseLive()) {
    return deleteFromMemory();
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripId)
      .eq("user_id", userId);

    if (error) {
      if (isTableMissingError(error)) {
        return deleteFromMemory();
      }
      return { success: false, error: error.message };
    }

    memoryTrips.delete(tripId);
    return { success: true };
  } catch (err: unknown) {
    const memResult = deleteFromMemory();
    if (memResult.success) return memResult;
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete trip",
    };
  }
}
