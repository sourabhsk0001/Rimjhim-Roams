import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  TravelMemory,
  CreateMemoryInput,
  UpdateMemoryInput,
  UserTravelMemoriesSummary,
  MemoryCategory,
  MemoryType,
} from "@/types/memories";

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url && key && !url.includes("mock-project") && key !== "mock-anon-key"
  );
}

// In-memory fallback for test runs and offline demo environments
export const memoryTravelMemories: Map<string, TravelMemory[]> = new Map();

// Sensitive information patterns: Credit cards, passwords, tokens, Aadhaar, PAN, SSN, medical
const SENSITIVE_PATTERNS = [
  // Credit / Debit card patterns (13 to 19 digits)
  /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/,
  // 16-digit cards with dashes/spaces
  /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/,
  // Indian Aadhaar numbers (12 digits)
  /\b[2-9]{1}\d{3}[ -]?\d{4}[ -]?\d{4}\b/,
  // Indian PAN Card (5 letters, 4 digits, 1 letter)
  /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i,
  // US SSN (9 digits formatted xxx-xx-xxxx)
  /\b\d{3}-\d{2}-\d{4}\b/,
  // Passwords, secrets, bearer tokens, api keys
  /(?:password|passwd|api_key|apikey|secret|token|bearer|cvv|pin)\s*[:=]\s*[^\s]+/i,
  // Bank Account / Routing numbers
  /(?:bank\s*account|routing\s*number|ifsc\s*code)\s*[:=]?\s*[A-Z0-9]{8,18}/i,
  // Medical diagnoses / sensitive health records
  /(?:hiv|cancer|diagnosis|prescription|biometric|medical\s*record)/i,
];

export class TravelMemoryService {
  /**
   * Strictly validates that memory entries do not contain sensitive personal,
   * financial, or medical data.
   */
  validateNonSensitive(keyword: string, notes?: string): void {
    const combined = `${keyword} ${notes || ""}`.trim();
    if (!combined) {
      throw new Error("Memory keyword cannot be empty.");
    }

    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(combined)) {
        throw new Error(
          "Sensitive information detected. TripWise Travel Memories only stores non-sensitive travel preferences (e.g. dietary choices, transit modes, lodging styles, pacing, and scenery)."
        );
      }
    }
  }

  /**
   * Retrieves all active travel memories for an authorized user.
   */
  async getMemories(userId: string): Promise<TravelMemory[]> {
    if (!userId) {
      throw new Error("User ID is required to retrieve travel memories.");
    }

    if (!isSupabaseLive()) {
      if (!memoryTravelMemories.has(userId) && (userId.includes("demo") || userId.includes("traveler"))) {
        this.seedDemoMemories(userId);
      }
      return (memoryTravelMemories.get(userId) || []).filter((m) => m.is_active);
    }

    try {
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("travel_memories")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase travel_memories lookup failed, falling back to memory:", error.message);
        if (!memoryTravelMemories.has(userId) && (userId.includes("demo") || userId.includes("traveler"))) {
          this.seedDemoMemories(userId);
        }
        return (memoryTravelMemories.get(userId) || []).filter((m) => m.is_active);
      }

      return (data || []) as TravelMemory[];
    } catch {
      if (!memoryTravelMemories.has(userId) && (userId.includes("demo") || userId.includes("traveler"))) {
        this.seedDemoMemories(userId);
      }
      return (memoryTravelMemories.get(userId) || []).filter((m) => m.is_active);
    }
  }

  /**
   * Retrieves a single travel memory by ID verifying user ownership.
   */
  async getMemoryById(id: string, userId: string): Promise<TravelMemory | null> {
    const memories = await this.getMemories(userId);
    return memories.find((m) => m.id === id) || null;
  }

  /**
   * Creates a new non-sensitive travel memory.
   */
  async createMemory(userId: string, input: CreateMemoryInput): Promise<TravelMemory> {
    if (!userId) {
      throw new Error("User ID is required to create a travel memory.");
    }

    const keyword = (input.keyword || "").trim();
    if (!keyword) {
      throw new Error("Memory keyword is required.");
    }

    // Guardrail against sensitive data
    this.validateNonSensitive(keyword, input.notes);

    const now = new Date().toISOString();
    const newMemory: TravelMemory = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      type: input.type,
      category: input.category,
      keyword,
      notes: input.notes?.trim() || null,
      is_active: input.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    if (!isSupabaseLive()) {
      const userList = memoryTravelMemories.get(userId) || [];
      userList.unshift(newMemory);
      memoryTravelMemories.set(userId, userList);
      return newMemory;
    }

    try {
      const supabase = createServerSupabase();
      const { data, error } = await (supabase
        .from("travel_memories") as any)
        .insert({
          user_id: userId,
          type: input.type,
          category: input.category,
          keyword,
          notes: input.notes?.trim() || null,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error || !data) {
        // Fallback to in-memory
        const userList = memoryTravelMemories.get(userId) || [];
        userList.unshift(newMemory);
        memoryTravelMemories.set(userId, userList);
        return newMemory;
      }

      return data as TravelMemory;
    } catch {
      const userList = memoryTravelMemories.get(userId) || [];
      userList.unshift(newMemory);
      memoryTravelMemories.set(userId, userList);
      return newMemory;
    }
  }

  /**
   * Updates an existing travel memory verifying user ownership.
   */
  async updateMemory(
    id: string,
    userId: string,
    input: UpdateMemoryInput
  ): Promise<TravelMemory> {
    if (!userId || !id) {
      throw new Error("Memory ID and User ID are required.");
    }

    if (input.keyword || input.notes) {
      this.validateNonSensitive(input.keyword || "", input.notes);
    }

    if (!isSupabaseLive()) {
      const userList = memoryTravelMemories.get(userId) || [];
      const index = userList.findIndex((m) => m.id === id);
      if (index === -1) {
        throw new Error("Travel memory not found or unauthorized access.");
      }

      const existing = userList[index];
      const updated: TravelMemory = {
        ...existing,
        type: input.type || existing.type,
        category: input.category || existing.category,
        keyword: input.keyword ? input.keyword.trim() : existing.keyword,
        notes: input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
        is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
        updated_at: new Date().toISOString(),
      };

      userList[index] = updated;
      memoryTravelMemories.set(userId, userList);
      return updated;
    }

    try {
      const supabase = createServerSupabase();
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.type) updatePayload.type = input.type;
      if (input.category) updatePayload.category = input.category;
      if (input.keyword) updatePayload.keyword = input.keyword.trim();
      if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null;
      if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

      const { data, error } = await (supabase
        .from("travel_memories") as any)
        .update(updatePayload)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !data) {
        throw new Error(error?.message || "Memory not found or unauthorized.");
      }

      return data as TravelMemory;
    } catch {
      // Memory fallback check
      const userList = memoryTravelMemories.get(userId) || [];
      const index = userList.findIndex((m) => m.id === id);
      if (index === -1) {
        throw new Error("Travel memory not found or unauthorized access.");
      }
      const existing = userList[index];
      const updated: TravelMemory = {
        ...existing,
        type: input.type || existing.type,
        category: input.category || existing.category,
        keyword: input.keyword ? input.keyword.trim() : existing.keyword,
        notes: input.notes !== undefined ? input.notes?.trim() || null : existing.notes,
        is_active: input.is_active !== undefined ? input.is_active : existing.is_active,
        updated_at: new Date().toISOString(),
      };
      userList[index] = updated;
      memoryTravelMemories.set(userId, userList);
      return updated;
    }
  }

  /**
   * Permanently deletes a travel memory for an authorized user.
   */
  async deleteMemory(id: string, userId: string): Promise<boolean> {
    if (!userId || !id) {
      throw new Error("Memory ID and User ID are required.");
    }

    if (!isSupabaseLive()) {
      const userList = memoryTravelMemories.get(userId) || [];
      const filtered = userList.filter((m) => m.id !== id);
      if (filtered.length === userList.length) {
        return false;
      }
      memoryTravelMemories.set(userId, filtered);
      return true;
    }

    try {
      const supabase = createServerSupabase();
      const { error } = await supabase
        .from("travel_memories")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.warn("Supabase delete failed, applying to memory store:", error.message);
        const userList = memoryTravelMemories.get(userId) || [];
        const filtered = userList.filter((m) => m.id !== id);
        memoryTravelMemories.set(userId, filtered);
        return true;
      }

      return true;
    } catch {
      const userList = memoryTravelMemories.get(userId) || [];
      const filtered = userList.filter((m) => m.id !== id);
      memoryTravelMemories.set(userId, filtered);
      return true;
    }
  }

  /**
   * Generates a clean categorized summary of likes and avoids for an authorized user.
   * Consumed by Destination Discovery, Hotel Selection, Restaurant Selection, and Planner.
   */
  async getUserMemoriesSummary(userId: string): Promise<UserTravelMemoriesSummary> {
    const memories = await this.getMemories(userId);

    const likes: string[] = [];
    const avoids: string[] = [];

    const byCategory: UserTravelMemoriesSummary["byCategory"] = {
      destination: { likes: [], avoids: [] },
      hotel: { likes: [], avoids: [] },
      restaurant: { likes: [], avoids: [] },
      transit: { likes: [], avoids: [] },
      itinerary: { likes: [], avoids: [] },
      general: { likes: [], avoids: [] },
    };

    for (const mem of memories) {
      const kw = mem.keyword.trim().toLowerCase();
      if (mem.type === "like") {
        if (!likes.includes(kw)) likes.push(kw);
        if (byCategory[mem.category] && !byCategory[mem.category].likes.includes(kw)) {
          byCategory[mem.category].likes.push(kw);
        }
      } else if (mem.type === "avoid") {
        if (!avoids.includes(kw)) avoids.push(kw);
        if (byCategory[mem.category] && !byCategory[mem.category].avoids.includes(kw)) {
          byCategory[mem.category].avoids.push(kw);
        }
      }
    }

    return {
      userId,
      totalMemories: memories.length,
      likes,
      avoids,
      destinationLikes: byCategory.destination.likes,
      destinationAvoids: byCategory.destination.avoids,
      hotelLikes: byCategory.hotel.likes,
      hotelAvoids: byCategory.hotel.avoids,
      restaurantLikes: byCategory.restaurant.likes,
      restaurantAvoids: byCategory.restaurant.avoids,
      transitLikes: byCategory.transit.likes,
      transitAvoids: byCategory.transit.avoids,
      itineraryLikes: byCategory.itinerary.likes,
      itineraryAvoids: byCategory.itinerary.avoids,
      byCategory,
    };
  }

  /**
   * Seeds demo travel preferences matching prompt examples:
   * Likes: Nature, Local food, Budget hotels, Train travel
   * Avoids: Luxury hotels, Overpacked itineraries
   */
  private seedDemoMemories(userId: string): void {
    const now = new Date().toISOString();
    const defaults: Array<{
      type: MemoryType;
      category: MemoryCategory;
      keyword: string;
      notes: string;
    }> = [
      {
        type: "like",
        category: "destination",
        keyword: "Nature",
        notes: "Prefers scenic landscapes, hill stations, and coastal nature",
      },
      {
        type: "like",
        category: "restaurant",
        keyword: "Local food",
        notes: "Prefers authentic regional dining and authentic local cuisines",
      },
      {
        type: "like",
        category: "hotel",
        keyword: "Budget hotels",
        notes: "Prefers cozy, cost-effective stays and value lodges",
      },
      {
        type: "like",
        category: "transit",
        keyword: "Train travel",
        notes: "Enjoys scenic rail routes and Indian Railways sleeper/express options",
      },
      {
        type: "avoid",
        category: "hotel",
        keyword: "Luxury hotels",
        notes: "Avoids expensive 5-star chains and overpriced resort markups",
      },
      {
        type: "avoid",
        category: "itinerary",
        keyword: "Overpacked itineraries",
        notes: "Prefers a relaxed daily pace with ample rest and buffer time",
      },
    ];

    const seeded: TravelMemory[] = defaults.map((d, i) => ({
      id: `mem-demo-${userId}-${i + 1}`,
      user_id: userId,
      type: d.type,
      category: d.category,
      keyword: d.keyword,
      notes: d.notes,
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    memoryTravelMemories.set(userId, seeded);
  }
}

export const travelMemoryService = new TravelMemoryService();
