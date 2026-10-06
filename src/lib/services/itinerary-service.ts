import { createClient as createServerSupabase, isTableMissingError, isSupabaseLive } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import {
  ItineraryItem,
  DayItineraryData,
  ScheduleValidationResult,
  OptimizeDayResult,
  ItineraryItemCategory,
  ItemPriority,
  DurationTier,
} from "@/types/time";
import { timeEngine, timeToMinutes, minutesToTime } from "@/lib/time/engine";
import { getTripById } from "@/lib/services/trip-service";
import { DEMO_ATTRACTIONS } from "@/lib/services/travel-data-service";

type ItineraryRow = Database["public"]["Tables"]["itineraries"]["Row"];
type ItineraryItemRow = Database["public"]["Tables"]["itinerary_items"]["Row"];

// In-memory fallback stores for local testing without live Supabase
export const memoryItineraries: Map<string, ItineraryRow> = new Map();
export const memoryItineraryItems: Map<string, ItineraryItemRow> = new Map();

/**
 * Loads all itinerary days and their items for a trip.
 * Automatically seeds baseline itinerary days if none exist yet.
 */
export async function getTripItineraries(
  tripId: string,
  userId: string
): Promise<{
  success: boolean;
  days?: DayItineraryData[];
  error?: string;
}> {
  const { trip, isAuthorized } = await getTripById(tripId, userId);
  if (!trip || !isAuthorized) {
    return { success: false, error: "Trip not found or unauthorized." };
  }

  // 1. Check existing itineraries
  let days = await loadItineraryDaysFromStore(tripId);

  // 2. If no days exist yet, seed baseline itinerary for the trip duration
  if (days.length === 0) {
    days = await seedBaselineItinerary(trip);
  }

  return { success: true, days };
}

/**
 * Loads a single day's itinerary with validation results
 */
export async function getItineraryDay(
  tripId: string,
  dayNumber: number,
  userId: string
): Promise<{
  success: boolean;
  day?: DayItineraryData;
  validation?: ScheduleValidationResult;
  error?: string;
}> {
  const all = await getTripItineraries(tripId, userId);
  if (!all.success || !all.days) {
    return { success: false, error: all.error };
  }

  const day = all.days.find((d) => d.day_number === dayNumber);
  if (!day) {
    return { success: false, error: `Day ${dayNumber} not found.` };
  }

  const validation = timeEngine.validateDailySchedule(day.items, {
    start: day.day_start_time,
    end: day.day_end_time,
  });

  return { success: true, day, validation };
}

/**
 * "Optimize Day": Reorders items, eliminates overlaps & closed-hour conflicts,
 * computes exact travel/wait/buffer, and persists the optimized schedule.
 */
export async function optimizeItineraryDay(
  tripId: string,
  dayNumber: number,
  userId: string
): Promise<{
  success: boolean;
  result?: OptimizeDayResult;
  error?: string;
}> {
  const dayRes = await getItineraryDay(tripId, dayNumber, userId);
  if (!dayRes.success || !dayRes.day) {
    return { success: false, error: dayRes.error };
  }

  const day = dayRes.day;
  const optimizeResult = timeEngine.optimizeDaySchedule(day.items, {
    start: day.day_start_time,
    end: day.day_end_time,
  });

  // Persist optimized items
  await persistOptimizedItems(day.id, tripId, optimizeResult.optimizedItems);

  return {
    success: true,
    result: {
      success: true,
      optimizedItems: optimizeResult.optimizedItems,
      changesMade: optimizeResult.changesMade,
      validation: optimizeResult.validation,
    },
  };
}

/**
 * Add a new item to an itinerary day
 */
export async function addItineraryItem(
  tripId: string,
  dayNumber: number,
  userId: string,
  itemInput: {
    title: string;
    category: ItineraryItemCategory;
    start_time: string;
    end_time: string;
    location: { latitude: number; longitude: number; name: string };
    visit_minutes: number;
    travel_minutes?: number;
    waiting_minutes?: number;
    buffer_minutes?: number;
    priority?: ItemPriority;
    duration_tier?: DurationTier;
    estimated_cost?: number;
    opening_time?: string;
    closing_time?: string;
  }
): Promise<{ success: boolean; item?: ItineraryItem; error?: string }> {
  const dayRes = await getItineraryDay(tripId, dayNumber, userId);
  if (!dayRes.success || !dayRes.day) {
    return { success: false, error: dayRes.error };
  }

  const day = dayRes.day;
  const id = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const travelMins = itemInput.travel_minutes ?? 0;
  const waitMins = itemInput.waiting_minutes ?? 0;
  const visitMins = Math.max(15, itemInput.visit_minutes);
  const bufferMins =
    itemInput.buffer_minutes ??
    timeEngine.calculateBuffer(travelMins, visitMins);

  const newItem: ItineraryItem = {
    id,
    itinerary_id: day.id,
    trip_id: tripId,
    title: itemInput.title.trim(),
    category: itemInput.category,
    date: day.date,
    start_time: itemInput.start_time,
    end_time: itemInput.end_time,
    location: itemInput.location,
    visit_minutes: visitMins,
    travel_minutes: travelMins,
    waiting_minutes: waitMins,
    buffer_minutes: bufferMins,
    estimated_cost: itemInput.estimated_cost ?? 0,
    priority: itemInput.priority ?? "medium",
    status: "scheduled",
    duration_tier: itemInput.duration_tier ?? "Normal",
    sort_order: day.items.length,
    opening_time: itemInput.opening_time,
    closing_time: itemInput.closing_time,
  };

  if (!isSupabaseLive()) {
    const row: ItineraryItemRow = {
      ...newItem,
      attraction_id: null,
      location: newItem.location as unknown as ItineraryItemRow["location"],
      created_at: now,
      updated_at: now,
    };
    memoryItineraryItems.set(id, row);
    return { success: true, item: newItem };
  }

  try {
    const supabase = createServerSupabase();
    const client = supabase as unknown as {
      from: (t: string) => {
        insert: (d: unknown) => Promise<{ error: { message: string } | null }>;
      };
    };

    const { error } = await client.from("itinerary_items").insert({
      id: newItem.id,
      itinerary_id: newItem.itinerary_id,
      trip_id: newItem.trip_id,
      title: newItem.title,
      category: newItem.category,
      date: newItem.date,
      start_time: newItem.start_time,
      end_time: newItem.end_time,
      location: newItem.location,
      visit_minutes: newItem.visit_minutes,
      travel_minutes: newItem.travel_minutes,
      waiting_minutes: newItem.waiting_minutes,
      buffer_minutes: newItem.buffer_minutes,
      estimated_cost: newItem.estimated_cost,
      priority: newItem.priority,
      status: newItem.status,
      duration_tier: newItem.duration_tier,
      sort_order: newItem.sort_order,
    });

    if (error) {
      if (isTableMissingError(error)) {
        const row: ItineraryItemRow = {
          ...newItem,
          attraction_id: null,
          location: newItem.location as unknown as ItineraryItemRow["location"],
          created_at: now,
          updated_at: now,
        };
        memoryItineraryItems.set(id, row);
        return { success: true, item: newItem };
      }
      return { success: false, error: error.message };
    }

    return { success: true, item: newItem };
  } catch (err: unknown) {
    const row: ItineraryItemRow = {
      ...newItem,
      attraction_id: null,
      location: newItem.location as unknown as ItineraryItemRow["location"],
      created_at: now,
      updated_at: now,
    };
    memoryItineraryItems.set(id, row);
    return { success: true, item: newItem };
  }
}

/**
 * Delete an item from an itinerary
 */
export async function deleteItineraryItem(
  tripId: string,
  itemId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { trip, isAuthorized } = await getTripById(tripId, userId);
  if (!trip || !isAuthorized) {
    return { success: false, error: "Unauthorized." };
  }

  if (!isSupabaseLive()) {
    memoryItineraryItems.delete(itemId);
    return { success: true };
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("itinerary_items")
      .delete()
      .eq("id", itemId)
      .eq("trip_id", tripId);

    if (error) {
      if (isTableMissingError(error)) {
        memoryItineraryItems.delete(itemId);
        return { success: true };
      }
      return { success: false, error: error.message };
    }
    memoryItineraryItems.delete(itemId);
    return { success: true };
  } catch (err: unknown) {
    memoryItineraryItems.delete(itemId);
    return { success: true };
  }
}

// ==============================================================================
// Internal Store & Seeding Helpers
// ==============================================================================

function loadMemoryItineraryDays(tripId: string): DayItineraryData[] {
  const dayRows = Array.from(memoryItineraries.values())
    .filter((i) => i.trip_id === tripId)
    .sort((a, b) => a.day_number - b.day_number);

  const result: DayItineraryData[] = [];
  for (const d of dayRows) {
    const items = Array.from(memoryItineraryItems.values())
      .filter((it) => it.itinerary_id === d.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((it) => ({
        ...it,
        location: it.location as unknown as ItineraryItem["location"],
      }));

    result.push({
      id: d.id,
      trip_id: d.trip_id,
      day_number: d.day_number,
      date: d.date,
      title: d.title || `Day ${d.day_number}`,
      theme: d.theme || undefined,
      day_start_time: d.day_start_time,
      day_end_time: d.day_end_time,
      items,
    });
  }
  return result;
}

async function loadItineraryDaysFromStore(
  tripId: string
): Promise<DayItineraryData[]> {
  if (!isSupabaseLive()) {
    return loadMemoryItineraryDays(tripId);
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("trip_id", tripId)
      .order("day_number", { ascending: true });

    if (error || !data || data.length === 0) {
      return loadMemoryItineraryDays(tripId);
    }

    const daysData = (data || []) as unknown as ItineraryRow[];
    const result: DayItineraryData[] = [];
    for (const d of daysData) {
      const { data: itemRows } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("itinerary_id", d.id)
        .order("sort_order", { ascending: true });

      const itemsData = (itemRows || []) as unknown as ItineraryItemRow[];
      result.push({
        id: d.id,
        trip_id: d.trip_id,
        day_number: d.day_number,
        date: d.date,
        title: d.title || `Day ${d.day_number}`,
        theme: d.theme || undefined,
        day_start_time: d.day_start_time,
        day_end_time: d.day_end_time,
        items: itemsData.map((it) => ({
          ...it,
          location: it.location as unknown as ItineraryItem["location"],
        })),
      });
    }

    return result;
  } catch {
    return loadMemoryItineraryDays(tripId);
  }
}

export async function persistOptimizedItems(
  itineraryId: string,
  tripId: string,
  items: ItineraryItem[]
) {
  // Always update memory store
  for (const [id, item] of Array.from(memoryItineraryItems.entries())) {
    if (item.itinerary_id === itineraryId) {
      memoryItineraryItems.delete(id);
    }
  }
  const now = new Date().toISOString();
  for (const item of items) {
    memoryItineraryItems.set(item.id, {
      ...item,
      attraction_id: item.attraction_id || null,
      location: item.location as unknown as ItineraryItemRow["location"],
      created_at: now,
      updated_at: now,
    });
  }

  if (!isSupabaseLive()) {
    return;
  }

  try {
    const supabase = createServerSupabase();
    await supabase.from("itinerary_items").delete().eq("itinerary_id", itineraryId);

    const client = supabase as unknown as {
      from: (t: string) => {
        insert: (d: unknown[]) => Promise<{ error: unknown }>;
      };
    };

    const payload = items.map((it, idx) => ({
      id: it.id,
      itinerary_id: itineraryId,
      trip_id: tripId,
      attraction_id: it.attraction_id || null,
      title: it.title,
      category: it.category,
      date: it.date,
      start_time: it.start_time,
      end_time: it.end_time,
      location: it.location,
      visit_minutes: it.visit_minutes,
      travel_minutes: it.travel_minutes,
      waiting_minutes: it.waiting_minutes,
      buffer_minutes: it.buffer_minutes,
      estimated_cost: it.estimated_cost,
      priority: it.priority,
      status: it.status,
      duration_tier: it.duration_tier,
      sort_order: idx,
    }));

    await client.from("itinerary_items").insert(payload);
  } catch {
    // Non-fatal fallback
  }
}

/**
 * Seeds a clean, deterministic baseline itinerary based on the trip's destination
 */
async function seedBaselineItinerary(trip: {
  id: string;
  destination: string;
  duration_days: number;
  start_date: string;
}): Promise<DayItineraryData[]> {
  const duration = Math.max(1, trip.duration_days || 3);
  const matchedAttractions = DEMO_ATTRACTIONS.filter((a) =>
    trip.destination.toLowerCase().includes(a.destination_id.replace("dest-", ""))
  );

  const availableAttractions =
    matchedAttractions.length > 0 ? matchedAttractions : DEMO_ATTRACTIONS.slice(0, 8);

  const days: DayItineraryData[] = [];
  const startDate = new Date(trip.start_date || "2026-11-01");

  for (let dayNum = 1; dayNum <= duration; dayNum++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (dayNum - 1));
    const dateStr = currentDate.toISOString().split("T")[0];

    const dayId = `itin-${trip.id}-d${dayNum}`;
    const now = new Date().toISOString();

    const dayRow: ItineraryRow = {
      id: dayId,
      trip_id: trip.id,
      day_number: dayNum,
      date: dateStr,
      title: `Day ${dayNum}: ${trip.destination} Highlights`,
      theme: dayNum === 1 ? "Arrival & Heritage" : dayNum === 2 ? "Scenic Views & Culture" : "Coastal & Relaxation",
      day_start_time: "08:30:00",
      day_end_time: "21:00:00",
      status: "draft",
      created_at: now,
      updated_at: now,
    };

    memoryItineraries.set(dayId, dayRow);

    // Pick 2-3 sights for this day
    const startIndex = ((dayNum - 1) * 2) % availableAttractions.length;
    const daySights = availableAttractions.slice(startIndex, startIndex + 2);

    const items: ItineraryItem[] = [];

    // Morning Sight (09:00 - 11:30)
    if (daySights[0]) {
      const s1 = daySights[0];
      const s1Id = `item-${dayId}-s1`;
      const s1Item: ItineraryItem = {
        id: s1Id,
        itinerary_id: dayId,
        trip_id: trip.id,
        attraction_id: s1.id,
        title: s1.name,
        category: "sightseeing",
        date: dateStr,
        start_time: "09:00",
        end_time: "11:30",
        location: {
          latitude: s1.latitude,
          longitude: s1.longitude,
          name: s1.name,
        },
        visit_minutes: 120,
        travel_minutes: 20,
        waiting_minutes: 15,
        buffer_minutes: 15,
        estimated_cost: s1.ticket_price || 100,
        priority: "must_visit",
        status: "scheduled",
        duration_tier: "Normal",
        sort_order: 0,
        opening_time: s1.opening_time,
        closing_time: s1.closing_time,
      };
      items.push(s1Item);
      memoryItineraryItems.set(s1Id, {
        ...s1Item,
        attraction_id: s1Item.attraction_id ?? null,
        location: s1Item.location as unknown as ItineraryItemRow["location"],
        created_at: now,
        updated_at: now,
      });
    }

    // Lunch Block (12:30 - 13:45)
    const lunchId = `item-${dayId}-lunch`;
    const lunchItem: ItineraryItem = {
      id: lunchId,
      itinerary_id: dayId,
      trip_id: trip.id,
      title: "Regional Culinary Lunch",
      category: "food",
      date: dateStr,
      start_time: "12:30",
      end_time: "13:45",
      location: {
        latitude: daySights[0]?.latitude || 26.9124,
        longitude: daySights[0]?.longitude || 75.7873,
        name: "Local Heritage Bistro",
      },
      visit_minutes: 75,
      travel_minutes: 15,
      waiting_minutes: 10,
      buffer_minutes: 10,
      estimated_cost: 650,
      priority: "high",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 1,
    };
    items.push(lunchItem);
    memoryItineraryItems.set(lunchId, {
      ...lunchItem,
      attraction_id: null,
      location: lunchItem.location as unknown as ItineraryItemRow["location"],
      created_at: now,
      updated_at: now,
    });

    // Afternoon / Sunset Sight (15:00 - 17:30)
    const s2 = daySights[1] || daySights[0];
    if (s2) {
      const s2Id = `item-${dayId}-s2`;
      const s2Item: ItineraryItem = {
        id: s2Id,
        itinerary_id: dayId,
        trip_id: trip.id,
        attraction_id: s2.id,
        title: s2.name,
        category: "sightseeing",
        date: dateStr,
        start_time: "15:00",
        end_time: "17:30",
        location: {
          latitude: s2.latitude,
          longitude: s2.longitude,
          name: s2.name,
        },
        visit_minutes: 120,
        travel_minutes: 25,
        waiting_minutes: 10,
        buffer_minutes: 15,
        estimated_cost: s2.ticket_price || 50,
        priority: "high",
        status: "scheduled",
        duration_tier: "Normal",
        sort_order: 2,
        opening_time: s2.opening_time,
        closing_time: s2.closing_time,
      };
      items.push(s2Item);
      memoryItineraryItems.set(s2Id, {
        ...s2Item,
        attraction_id: s2Item.attraction_id ?? null,
        location: s2Item.location as unknown as ItineraryItemRow["location"],
        created_at: now,
        updated_at: now,
      });
    }

    days.push({
      id: dayId,
      trip_id: trip.id,
      day_number: dayNum,
      date: dateStr,
      title: dayRow.title || `Day ${dayNum}`,
      theme: dayRow.theme || undefined,
      day_start_time: "08:30:00",
      day_end_time: "21:00:00",
      items,
    });
  }

  return days;
}
