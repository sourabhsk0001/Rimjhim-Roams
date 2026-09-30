import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type TravellerProfileRow = Database["public"]["Tables"]["traveller_profiles"]["Row"];
export type TravelPreferencesRow = Database["public"]["Tables"]["travel_preferences"]["Row"];

const memoryProfiles: Map<string, ProfileRow> = new Map();
const memoryTravellers: Map<string, TravellerProfileRow> = new Map();
const memoryPreferences: Map<string, TravelPreferencesRow> = new Map();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

export async function getUserProfileData(userId: string, email: string = "user@example.com") {
  if (!isSupabaseLive()) {
    if (!memoryProfiles.has(userId)) {
      const now = new Date().toISOString();
      memoryProfiles.set(userId, {
        id: userId,
        email,
        full_name: "Demo Traveler",
        avatar_url: null,
        created_at: now,
        updated_at: now,
      });
      memoryTravellers.set(userId, {
        id: `traveller-${userId}`,
        user_id: userId,
        nationality: "India",
        phone_number: "+91 9876543210",
        bio: "Curious explorer and cultural enthusiast.",
        emergency_contact: { name: "Emergency Contact", phone: "+91 9876543211" },
        created_at: now,
        updated_at: now,
      });
      memoryPreferences.set(userId, {
        id: `pref-${userId}`,
        user_id: userId,
        preferred_pace: "moderate",
        budget_tier: "moderate",
        dietary_restrictions: ["Vegetarian"],
        interests: ["Architecture", "Nature", "Local Markets"],
        preferred_accommodation: "Boutique Hotel",
        created_at: now,
        updated_at: now,
      });
    }

    return {
      profile: memoryProfiles.get(userId) || null,
      traveller: memoryTravellers.get(userId) || null,
      preferences: memoryPreferences.get(userId) || null,
    };
  }

  try {
    const supabase = createServerSupabase();

    const [pRes, tRes, prefRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("traveller_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("travel_preferences").select("*").eq("user_id", userId).single(),
    ]);

    return {
      profile: pRes.data || null,
      traveller: tRes.data || null,
      preferences: prefRes.data || null,
    };
  } catch {
    return { profile: null, traveller: null, preferences: null };
  }
}

export async function updateUserProfileData(
  userId: string,
  profileUpdates: Partial<ProfileRow>,
  travellerUpdates: Partial<TravellerProfileRow>,
  preferenceUpdates: Partial<TravelPreferencesRow>
) {
  if (!isSupabaseLive()) {
    const existingP = memoryProfiles.get(userId);
    if (existingP) {
      memoryProfiles.set(userId, { ...existingP, ...profileUpdates, updated_at: new Date().toISOString() });
    }
    const existingT = memoryTravellers.get(userId);
    if (existingT) {
      memoryTravellers.set(userId, { ...existingT, ...travellerUpdates, updated_at: new Date().toISOString() });
    }
    const existingPref = memoryPreferences.get(userId);
    if (existingPref) {
      memoryPreferences.set(userId, { ...existingPref, ...preferenceUpdates, updated_at: new Date().toISOString() });
    }
    return { success: true };
  }

  try {
    const supabase = createServerSupabase();

    await Promise.all([
      // @ts-expect-error Supabase generic builder inference
      supabase.from("profiles").update(profileUpdates).eq("id", userId),
      // @ts-expect-error Supabase generic builder inference
      supabase.from("traveller_profiles").upsert({ user_id: userId, ...travellerUpdates }),
      // @ts-expect-error Supabase generic builder inference
      supabase.from("travel_preferences").upsert({ user_id: userId, ...preferenceUpdates }),
    ]);

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update profile",
    };
  }
}
