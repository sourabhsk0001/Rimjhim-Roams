// ==============================================================================
// Packing Service
// Manages trip packing lists, item persistence, checkbox state, and custom items
// ==============================================================================

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getTripById } from "@/lib/services/trip-service";
import { collaborationService } from "@/lib/services/collaboration-service";
import { getTripItineraries } from "@/lib/services/itinerary-service";
import { weatherService } from "@/lib/services/weather-service";
import { packingEngine } from "@/lib/engines/packing-engine";
import {
  PackingCategory,
  PackingItem,
  PackingListSummary,
  GeneratePackingInput,
} from "@/types/travel-management";

export const memoryPackingItems: Map<string, PackingItem> = new Map();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

export class PackingService {
  /**
   * Retrieves packing list for an authorized trip.
   * If no items exist yet, generates an initial adaptive packing list based on
   * destination, duration, weather, activities, and traveller profile.
   */
  async getTripPackingList(
    tripId: string,
    userId: string
  ): Promise<{
    authorized: boolean;
    summary?: PackingListSummary;
    items?: PackingItem[];
    error?: string;
  }> {
    const isMember = await collaborationService.isUserTripMember(tripId, userId);
    const { trip } = await getTripById(tripId, userId);

    if (!trip || (!isMember && trip.user_id !== userId)) {
      return {
        authorized: false,
        error: "Unauthorized: You do not have permission to access packing for this trip.",
      };
    }

    let items = await this.loadItemsFromStore(tripId);

    // If no items exist yet, generate new packing list
    if (items.length === 0) {
      items = await this.generateAndStoreBaseline(trip, userId);
    }

    const factors = await this.resolvePackingFactors(trip, userId);
    const summary = packingEngine.summarizePackingList(tripId, items, factors);

    return {
      authorized: true,
      summary,
      items,
    };
  }

  /**
   * Toggles the packed state of an item (checkbox).
   */
  async togglePackingItem(
    tripId: string,
    itemId: string,
    packed: boolean,
    userId: string
  ): Promise<{
    authorized: boolean;
    item?: PackingItem;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role) {
      return { authorized: false, error: "Unauthorized access to trip packing." };
    }

    if (!isSupabaseLive()) {
      const item = memoryPackingItems.get(itemId);
      if (!item || item.trip_id !== tripId) {
        return { authorized: true, error: "Packing item not found." };
      }
      item.packed = packed;
      item.updated_at = new Date().toISOString();
      memoryPackingItems.set(itemId, item);
      return { authorized: true, item };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("trip_packing_items")
        .update({ packed, updated_at: new Date().toISOString() })
        .eq("id", itemId)
        .eq("trip_id", tripId)
        .select()
        .single();

      if (error) return { authorized: true, error: error.message };
      return { authorized: true, item: data as PackingItem };
    } catch (err: unknown) {
      return { authorized: true, error: err instanceof Error ? err.message : "Error updating item." };
    }
  }

  /**
   * Adds a custom user-defined packing item.
   */
  async addCustomItem(
    tripId: string,
    input: {
      category: PackingCategory;
      item_name: string;
      quantity?: number;
      essential?: boolean;
      notes?: string;
    },
    userId: string
  ): Promise<{
    authorized: boolean;
    item?: PackingItem;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role || role === "viewer") {
      return { authorized: false, error: "Unauthorized: Viewers cannot add packing items." };
    }

    const now = new Date().toISOString();
    const newItem: PackingItem = {
      id: `pack-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      trip_id: tripId,
      category: input.category,
      item_name: input.item_name.trim(),
      quantity: Math.max(1, input.quantity || 1),
      packed: false,
      is_custom: true,
      essential: Boolean(input.essential),
      notes: input.notes?.trim(),
      created_at: now,
      updated_at: now,
    };

    if (!isSupabaseLive()) {
      memoryPackingItems.set(newItem.id, newItem);
      return { authorized: true, item: newItem };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data, error } = await supabase
        .from("trip_packing_items")
        .insert({
          trip_id: tripId,
          category: newItem.category,
          item_name: newItem.item_name,
          quantity: newItem.quantity,
          packed: false,
          is_custom: true,
          essential: newItem.essential,
          notes: newItem.notes,
        })
        .select()
        .single();

      if (error) return { authorized: true, error: error.message };
      return { authorized: true, item: data as PackingItem };
    } catch (err: unknown) {
      return { authorized: true, error: err instanceof Error ? err.message : "Error inserting item." };
    }
  }

  /**
   * Deletes a packing item.
   */
  async deletePackingItem(
    tripId: string,
    itemId: string,
    userId: string
  ): Promise<{
    authorized: boolean;
    success: boolean;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role || role === "viewer") {
      return { authorized: false, success: false, error: "Unauthorized: Viewers cannot delete packing items." };
    }

    if (!isSupabaseLive()) {
      memoryPackingItems.delete(itemId);
      return { authorized: true, success: true };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { error } = await supabase
        .from("trip_packing_items")
        .delete()
        .eq("id", itemId)
        .eq("trip_id", tripId);

      if (error) return { authorized: true, success: false, error: error.message };
      return { authorized: true, success: true };
    } catch (err: unknown) {
      return { authorized: true, success: false, error: err instanceof Error ? err.message : "Error deleting item." };
    }
  }

  /**
   * Checks or unchecks all items in a category.
   */
  async checkAllCategory(
    tripId: string,
    category: PackingCategory,
    packed: boolean,
    userId: string
  ): Promise<{
    authorized: boolean;
    success: boolean;
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role) {
      return { authorized: false, success: false, error: "Unauthorized access to trip packing." };
    }

    if (!isSupabaseLive()) {
      for (const item of Array.from(memoryPackingItems.values())) {
        if (item.trip_id === tripId && item.category === category) {
          item.packed = packed;
          item.updated_at = new Date().toISOString();
        }
      }
      return { authorized: true, success: true };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { error } = await supabase
        .from("trip_packing_items")
        .update({ packed, updated_at: new Date().toISOString() })
        .eq("trip_id", tripId)
        .eq("category", category);

      if (error) return { authorized: true, success: false, error: error.message };
      return { authorized: true, success: true };
    } catch (err: unknown) {
      return { authorized: true, success: false, error: err instanceof Error ? err.message : "Error updating category items." };
    }
  }

  /**
   * Regenerates a fresh packing list from current weather, duration, and itinerary.
   */
  async regeneratePackingList(
    tripId: string,
    userId: string
  ): Promise<{
    authorized: boolean;
    items?: PackingItem[];
    error?: string;
  }> {
    const role = await collaborationService.getUserTripRole(tripId, userId);
    if (!role || role === "viewer") {
      return { authorized: false, error: "Unauthorized: Viewers cannot regenerate packing lists." };
    }

    const { trip } = await getTripById(tripId, userId);
    if (!trip) {
      return { authorized: true, error: "Trip not found." };
    }

    // Clear existing generated items (preserve custom ones if desired, or wipe for fresh list)
    if (!isSupabaseLive()) {
      for (const [id, item] of Array.from(memoryPackingItems.entries())) {
        if (item.trip_id === tripId) {
          memoryPackingItems.delete(id);
        }
      }
    } else {
      const supabase = createServerSupabase() as any;
      await supabase.from("trip_packing_items").delete().eq("trip_id", tripId);
    }

    const freshItems = await this.generateAndStoreBaseline(trip, userId);
    return { authorized: true, items: freshItems };
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private async loadItemsFromStore(tripId: string): Promise<PackingItem[]> {
    if (!isSupabaseLive()) {
      return Array.from(memoryPackingItems.values()).filter((i) => i.trip_id === tripId);
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data } = await supabase
        .from("trip_packing_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("category", { ascending: true })
        .order("created_at", { ascending: true });

      return (data as PackingItem[]) || [];
    } catch {
      return [];
    }
  }

  private async generateAndStoreBaseline(trip: any, userId: string): Promise<PackingItem[]> {
    const factors = await this.resolvePackingFactors(trip, userId);
    const generated = packingEngine.generatePackingList(trip.id, factors);

    if (!isSupabaseLive()) {
      for (const item of generated) {
        memoryPackingItems.set(item.id, item);
      }
      return generated;
    }

    try {
      const supabase = createServerSupabase() as any;
      const rows = generated.map((g) => ({
        trip_id: trip.id,
        category: g.category,
        item_name: g.item_name,
        quantity: g.quantity,
        packed: false,
        is_custom: false,
        essential: g.essential,
        notes: g.notes,
      }));

      const { data, error } = await supabase
        .from("trip_packing_items")
        .insert(rows)
        .select();

      if (error || !data) return generated;
      return data as PackingItem[];
    } catch {
      return generated;
    }
  }

  private async resolvePackingFactors(trip: any, userId: string): Promise<GeneratePackingInput> {
    const activities: string[] = [];

    // Extract activities from scheduled itinerary
    try {
      const itinRes = await getTripItineraries(trip.id, userId);
      if (itinRes.success && itinRes.days) {
        for (const day of itinRes.days) {
          for (const item of day.items) {
            activities.push(item.title);
            if (item.category) activities.push(item.category);
          }
        }
      }
    } catch {
      // Fallback
    }

    // Extract activities from preferences themes
    const themes = (trip.preferences as any)?.themes || [];
    if (Array.isArray(themes)) {
      activities.push(...themes);
    }

    // Extract weather snapshot if available
    let weatherData: GeneratePackingInput["weather"] = undefined;
    try {
      const weatherRes = await weatherService.getTripWeather(trip.id, userId);
      if (weatherRes.success && weatherRes.weather) {
        weatherData = {
          temperature: weatherRes.weather.current.temperature,
          condition: weatherRes.weather.current.condition,
          rainProbability: weatherRes.weather.current.precipitationProbability,
        };
      }
    } catch {
      // Weather optional
    }

    return {
      destination: trip.destination,
      duration: trip.duration_days,
      weather: weatherData,
      activities,
      travellerType: trip.traveller_type,
      travellerCount: trip.traveller_count,
    };
  }
}

export const packingService = new PackingService();
