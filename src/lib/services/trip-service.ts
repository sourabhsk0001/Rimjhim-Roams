import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { TripInputData, validateTripInput } from "@/lib/validation/trip";

export type TripRow = Database["public"]["Tables"]["trips"]["Row"];

// Fallback in-memory store for local testing without active Supabase credentials
const memoryTrips: Map<string, TripRow> = new Map();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

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

  if (!isSupabaseLive()) {
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
    return { success: true, data: newTrip };
  }

  try {
    // @ts-expect-error Supabase generic builder inference
    const { data, error } = await supabase
      .from("trips")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, data: data as unknown as TripRow };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Database error",
    };
  }
}

export async function getUserTrips(userId: string): Promise<{
  upcoming: TripRow[];
  previous: TripRow[];
}> {
  if (!isSupabaseLive()) {
    const today = new Date().toISOString().split("T")[0];
    const userTrips = Array.from(memoryTrips.values()).filter(
      (t) => t.user_id === userId
    );
    const upcoming = userTrips
      .filter((t) => t.start_date >= today)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const previous = userTrips
      .filter((t) => t.start_date < today)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
    return { upcoming, previous };
  }

  try {
    const supabase = createServerSupabase();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("start_date", { ascending: true });

    if (error || !data) {
      return { upcoming: [], previous: [] };
    }

    const allTrips = (data as unknown as TripRow[]) || [];
    const upcoming = allTrips.filter((t) => t.start_date >= today);
    const previous = allTrips
      .filter((t) => t.start_date < today)
      .sort((a, b) => b.start_date.localeCompare(a.start_date));

    return { upcoming, previous };
  } catch {
    return { upcoming: [], previous: [] };
  }
}

export async function getTripById(
  tripId: string,
  userId: string
): Promise<{ trip: TripRow | null; isAuthorized: boolean }> {
  if (!isSupabaseLive()) {
    const trip = memoryTrips.get(tripId) || null;
    if (!trip) return { trip: null, isAuthorized: false };
    const isAuthorized = trip.user_id === userId;
    return { trip: isAuthorized ? trip : null, isAuthorized };
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .single();

    if (error || !data) {
      return { trip: null, isAuthorized: false };
    }

    // Handled by RLS policies
    return { trip: data, isAuthorized: true };
  } catch {
    return { trip: null, isAuthorized: false };
  }
}

export async function deleteTrip(
  tripId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseLive()) {
    const trip = memoryTrips.get(tripId);
    if (!trip || trip.user_id !== userId) {
      return { success: false, error: "Unauthorized or trip not found." };
    }
    memoryTrips.delete(tripId);
    return { success: true };
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("trips")
      .delete()
      .eq("id", tripId)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete trip",
    };
  }
}
