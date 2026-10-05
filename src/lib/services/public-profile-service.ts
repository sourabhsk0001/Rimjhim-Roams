// ==============================================================================
// Rimjhim Roams (TripWise AI) — Public Profile Service
// Manages public community explorer profiles with strict clean-format enforcement
// and strict RLS/privacy separation from private user profile tables.
// ==============================================================================

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { appDb, DbPublicProfile } from "@/lib/db/app-db";
import {
  validatePublicProfileInput,
  PublicProfileInput,
} from "@/lib/validation/public-profile";

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

export interface PublicProfileFilter {
  travelStyle?: string;
  search?: string;
  limit?: number;
}

export class PublicProfileService {
  /**
   * Retrieves public explorer profiles.
   * STRICT PRIVACY: Returns ONLY public profile attributes (no email, phone, or private data).
   */
  async getPublicProfiles(filter?: PublicProfileFilter): Promise<DbPublicProfile[]> {
    if (isSupabaseLive()) {
      try {
        const supabase = createServerSupabase() as any;
        let query = supabase
          .from("public_profiles")
          .select(
            "id, user_id, username, display_name, bio, avatar_url, home_city, travel_style, visited_states_count, badges, top_destinations, is_public, created_at, updated_at"
          )
          .eq("is_public", true);

        if (filter?.travelStyle) {
          query = query.eq("travel_style", filter.travelStyle.toLowerCase());
        }

        if (filter?.search) {
          const term = filter.search.trim().toLowerCase();
          query = query.or(
            `username.ilike.%${term}%,display_name.ilike.%${term}%,home_city.ilike.%${term}%,bio.ilike.%${term}%`
          );
        }

        const limit = filter?.limit ? Math.min(Math.max(1, filter.limit), 100) : 50;
        query = query.limit(limit).order("created_at", { ascending: false });

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as DbPublicProfile[];
        }
      } catch (err) {
        console.warn("[PublicProfileService] Supabase query failed, falling back to local persistent DB:", err);
      }
    }

    // Local / fallback persistent store
    return appDb.getPublicProfiles(filter);
  }

  /**
   * Retrieves a single public profile by unique username.
   */
  async getPublicProfileByUsername(username: string): Promise<DbPublicProfile | null> {
    const cleanUsername = username.trim().toLowerCase();

    if (isSupabaseLive()) {
      try {
        const supabase = createServerSupabase() as any;
        const { data, error } = await supabase
          .from("public_profiles")
          .select(
            "id, user_id, username, display_name, bio, avatar_url, home_city, travel_style, visited_states_count, badges, top_destinations, is_public, created_at, updated_at"
          )
          .eq("username", cleanUsername)
          .eq("is_public", true)
          .maybeSingle();

        if (!error && data) {
          return data as DbPublicProfile;
        }
      } catch (err) {
        console.warn("[PublicProfileService] Supabase getByUsername failed, falling back to local persistent DB:", err);
      }
    }

    return appDb.getPublicProfileByUsername(cleanUsername);
  }

  /**
   * Retrieves a public profile by authenticated user ID.
   */
  async getPublicProfileByUserId(userId: string): Promise<DbPublicProfile | null> {
    if (isSupabaseLive()) {
      try {
        const supabase = createServerSupabase() as any;
        const { data, error } = await supabase
          .from("public_profiles")
          .select(
            "id, user_id, username, display_name, bio, avatar_url, home_city, travel_style, visited_states_count, badges, top_destinations, is_public, created_at, updated_at"
          )
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) {
          return data as DbPublicProfile;
        }
      } catch (err) {
        console.warn("[PublicProfileService] Supabase getByUserId failed, falling back to local persistent DB:", err);
      }
    }

    return appDb.getPublicProfileByUserId(userId);
  }

  /**
   * Upserts the active user's public profile.
   * Strict clean format validation is enforced. Malformed or dirty data is rejected.
   */
  async upsertPublicProfile(
    userId: string,
    input: unknown
  ): Promise<{ success: boolean; profile?: DbPublicProfile; error?: string }> {
    // 1. Strict Validation & Formatting Gate
    const validation = validatePublicProfileInput(input);
    if (!validation.isValid || !validation.data) {
      return {
        success: false,
        error: `Validation error: ${validation.errors.join("; ")}`,
      };
    }

    const clean = validation.data;

    if (isSupabaseLive()) {
      try {
        const supabase = createServerSupabase() as any;
        const now = new Date().toISOString();

        // Check if username taken by someone else
        const { data: existingUser } = await supabase
          .from("public_profiles")
          .select("id, user_id")
          .eq("username", clean.username)
          .maybeSingle();

        if (existingUser && existingUser.user_id !== userId) {
          return {
            success: false,
            error: `Username '${clean.username}' is already taken by another explorer.`,
          };
        }

        const payload = {
          user_id: userId,
          username: clean.username,
          display_name: clean.display_name,
          bio: clean.bio || null,
          avatar_url: clean.avatar_url || null,
          home_city: clean.home_city || null,
          travel_style: clean.travel_style || "balanced",
          visited_states_count: clean.visited_states_count ?? 0,
          badges: clean.badges || [],
          top_destinations: clean.top_destinations || [],
          is_public: clean.is_public !== undefined ? clean.is_public : true,
          updated_at: now,
        };

        const { data, error } = await supabase
          .from("public_profiles")
          .upsert(payload, { onConflict: "user_id" })
          .select()
          .single();

        if (!error && data) {
          return { success: true, profile: data as DbPublicProfile };
        } else if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[PublicProfileService] Supabase upsert error, falling back to local persistent DB:", message);
      }
    }

    return appDb.upsertPublicProfile(userId, clean);
  }
}

export const publicProfileService = new PublicProfileService();
