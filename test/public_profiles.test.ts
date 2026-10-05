import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  validatePublicProfileInput,
  sanitizePublicProfileInput,
  ALLOWED_TRAVEL_STYLES,
} from "@/lib/validation/public-profile";
import { appDb, SAMPLE_PUBLIC_PROFILES } from "@/lib/db/app-db";
import { publicProfileService } from "@/lib/services/public-profile-service";

// ==============================================================================
// 1. Clean Format Validation Tests
// ==============================================================================

test("Public Profiles Validation: Rejects invalid or dirty usernames", () => {
  const invalidUsernames = [
    "user name", // contains space
    "Priya_Travels", // uppercase
    "ab", // too short (< 3 chars)
    "a".repeat(35), // too long (> 30 chars)
    "priya<script>", // script injection attempt
    "priya@home", // special symbol @
    "user$name", // symbol $
    "admin", // reserved system username
    "api", // reserved system username
    "support", // reserved system username
  ];

  for (const username of invalidUsernames) {
    const result = validatePublicProfileInput({
      username,
      display_name: "Valid Explorer",
    });
    assert.strictEqual(
      result.isValid,
      false,
      `Username '${username}' should be rejected by clean-format validation`
    );
    assert.ok(result.errors.length > 0);
  }
});

test("Public Profiles Validation: Rejects XSS / HTML tags in display_name and bio", () => {
  const dirtyInputs = [
    {
      username: "clean_user",
      display_name: "<script>alert('xss')</script>",
      bio: "Clean bio",
    },
    {
      username: "clean_user",
      display_name: "Clean Name",
      bio: "Hello <img src=x onerror=alert(1)>",
    },
    {
      username: "clean_user",
      display_name: "<b>Bold Hacker</b>",
      bio: "Bio with <iframe>",
    },
    {
      username: "clean_user",
      display_name: "Clean Name",
      home_city: "City <tag>",
    },
  ];

  for (const dirty of dirtyInputs) {
    const result = validatePublicProfileInput(dirty);
    assert.strictEqual(
      result.isValid,
      false,
      `Input containing HTML/XSS should be rejected: ${JSON.stringify(dirty)}`
    );
    assert.ok(
      result.errors.some((e) => e.includes("HTML") || e.includes("invalid characters")),
      "Error should explicitly indicate HTML/tag violation"
    );
  }
});

test("Public Profiles Validation: Rejects invalid travel style", () => {
  const result = validatePublicProfileInput({
    username: "valid_nomad",
    display_name: "Valid Nomad",
    travel_style: "invalid_unsupported_style" as any,
  });

  assert.strictEqual(result.isValid, false);
  assert.ok(
    result.errors.some((e) => e.includes("Invalid travel style")),
    "Should report unsupported travel style"
  );
});

test("Public Profiles Validation: Rejects invalid visited_states_count", () => {
  const badCounts = [-1, 37, 100, 3.14];

  for (const count of badCounts) {
    const result = validatePublicProfileInput({
      username: "valid_nomad",
      display_name: "Valid Nomad",
      visited_states_count: count,
    });
    assert.strictEqual(
      result.isValid,
      false,
      `State count ${count} should be rejected (must be integer 0-36)`
    );
  }
});

test("Public Profiles Validation: Rejects HTML tags inside badges and destinations", () => {
  const badBadges = validatePublicProfileInput({
    username: "valid_nomad",
    display_name: "Valid Nomad",
    badges: ["<script>bad</script>", "Clean Badge"],
  });
  assert.strictEqual(badBadges.isValid, false);

  const badDestinations = validatePublicProfileInput({
    username: "valid_nomad",
    display_name: "Valid Nomad",
    top_destinations: ["Goa", "Mumbai <style>"],
  });
  assert.strictEqual(badDestinations.isValid, false);
});

test("Public Profiles Validation: Accepts clean formatted inputs", () => {
  const cleanInput = {
    username: "rohit_wanderer",
    display_name: "Rohit Verma",
    bio: "Passionate backpacker exploring Western Ghats trails and coastal homestays.",
    home_city: "Pune, Maharashtra",
    travel_style: "backpacker" as const,
    visited_states_count: 12,
    badges: ["Ghats Pioneer", "Monsoon Explorer"],
    top_destinations: ["Mahabaleshwar", "Gokarna", "Munnar"],
    is_public: true,
  };

  const result = validatePublicProfileInput(cleanInput);
  assert.strictEqual(result.isValid, true);
  assert.deepStrictEqual(result.errors, []);
  assert.strictEqual(result.data?.username, "rohit_wanderer");
  assert.strictEqual(result.data?.travel_style, "backpacker");
  assert.strictEqual(result.data?.visited_states_count, 12);
});

test("Public Profiles Sanitizer: Cleans dirty inputs safely", () => {
  const sanitized = sanitizePublicProfileInput({
    username: "Priya Traveler 99!",
    display_name: "  <b>Priya</b> Sharma  ",
    bio: "Loves travel <script>alert(1)</script> and coffee",
    visited_states_count: 50, // exceeds 36
    badges: ["<b>Badge 1</b>", "  Badge 2  "],
  });

  assert.strictEqual(/^[a-z0-9_-]+$/.test(sanitized.username), true);
  assert.strictEqual(sanitized.display_name, "Priya Sharma");
  assert.strictEqual(sanitized.visited_states_count, 36, "Should clamp to max states 36");
  assert.ok(sanitized.badges);
  assert.strictEqual(sanitized.badges[0], "Badge 1");
  assert.strictEqual(sanitized.badges[1], "Badge 2");
});

// ==============================================================================
// 2. Sample Data Verification
// ==============================================================================

test("Public Profiles Sample Data: Pre-configured sample profiles are present and valid", () => {
  assert.strictEqual(
    SAMPLE_PUBLIC_PROFILES.length,
    5,
    "Should have 5 pre-configured sample explorer profiles"
  );

  const sampleUsernames = [
    "priya_travels",
    "kabir_peaks",
    "ananya_coastal",
    "vikram_royal",
    "zoya_slowroad",
  ];

  for (const expectedUsername of sampleUsernames) {
    const profile = SAMPLE_PUBLIC_PROFILES.find((p) => p.username === expectedUsername);
    assert.ok(profile, `Sample profile for '${expectedUsername}' must exist`);
    assert.ok(profile.display_name.length >= 2, "Display name must be valid");
    assert.ok(ALLOWED_TRAVEL_STYLES.includes(profile.travel_style as any), "Travel style must be allowed");
    assert.ok(profile.visited_states_count >= 0 && profile.visited_states_count <= 36, "Visited states must be 0-36");
    assert.ok(Array.isArray(profile.badges) && profile.badges.length > 0, "Badges must not be empty");
    assert.ok(Array.isArray(profile.top_destinations) && profile.top_destinations.length > 0, "Top destinations must not be empty");
    assert.strictEqual(profile.is_public, true, "Sample profile must be public");

    // Re-verify against clean-format validator
    const validation = validatePublicProfileInput(profile);
    assert.strictEqual(
      validation.isValid,
      true,
      `Sample profile '${expectedUsername}' must pass clean-format validation: ${validation.errors.join(", ")}`
    );
  }
});

// ==============================================================================
// 3. RLS & Privacy Separation Verification
// ==============================================================================

test("Privacy Separation: Public profile records NEVER contain sensitive user PII", async () => {
  const profiles = await publicProfileService.getPublicProfiles();
  assert.ok(profiles.length >= 5, "Should return seeded public profiles");

  for (const p of profiles) {
    // Assert NO private sensitive fields exist
    assert.strictEqual((p as any).email, undefined, "Public profile must NOT have email");
    assert.strictEqual((p as any).phone_number, undefined, "Public profile must NOT have phone_number");
    assert.strictEqual((p as any).emergency_contact, undefined, "Public profile must NOT have emergency_contact");
    assert.strictEqual((p as any).password_hash, undefined, "Public profile must NOT have password_hash");
    assert.strictEqual((p as any).salt, undefined, "Public profile must NOT have salt");
    assert.strictEqual((p as any).budget, undefined, "Public profile must NOT expose private user budget");
  }
});

test("Privacy Separation: Private user profile remains isolated from public profiles", () => {
  const privateProfile = appDb.getProfile("demo-user-123");
  assert.ok(privateProfile, "Demo user private profile should exist");
  assert.strictEqual(privateProfile.email, "demo@tripwise.ai");

  // Verify that querying public profiles does NOT return the private profile object
  const publicPriya = appDb.getPublicProfileByUsername("priya_travels");
  assert.ok(publicPriya);
  assert.strictEqual((publicPriya as any).email, undefined);
  assert.strictEqual(publicPriya.username, "priya_travels");
});

test("Public Profile Isolation: User cannot overwrite another user's public profile username", async () => {
  const userA = "user-alice-101";
  const userB = "user-bob-202";

  // Alice creates her profile
  const resAlice = await publicProfileService.upsertPublicProfile(userA, {
    username: "alice_explorer",
    display_name: "Alice Nomad",
    travel_style: "adventure",
    visited_states_count: 5,
  });
  assert.strictEqual(resAlice.success, true);

  // Bob tries to steal Alice's username
  const resBob = await publicProfileService.upsertPublicProfile(userB, {
    username: "alice_explorer",
    display_name: "Bob Impersonator",
    travel_style: "cultural",
    visited_states_count: 1,
  });

  assert.strictEqual(resBob.success, false);
  assert.ok(
    resBob.error?.includes("already taken"),
    "Should reject username theft by distinct user"
  );

  // Alice can update her own profile
  const resAliceUpdate = await publicProfileService.upsertPublicProfile(userA, {
    username: "alice_explorer",
    display_name: "Alice Nomad Updated",
    travel_style: "cultural",
    visited_states_count: 6,
  });
  assert.strictEqual(resAliceUpdate.success, true);
  assert.strictEqual(resAliceUpdate.profile?.display_name, "Alice Nomad Updated");
});

// ==============================================================================
// 4. Discovery & Filtering
// ==============================================================================

test("Public Profiles Discovery: Search and style filtering work correctly", async () => {
  // Filter by travel_style: adventure
  const adventureProfiles = await publicProfileService.getPublicProfiles({
    travelStyle: "adventure",
  });
  assert.ok(adventureProfiles.length >= 1);
  assert.ok(
    adventureProfiles.every((p) => p.travel_style === "adventure"),
    "All returned profiles must have travel_style = adventure"
  );
  assert.ok(adventureProfiles.some((p) => p.username === "kabir_peaks"));

  // Search by keyword: 'Rajasthan' or 'Jaipur'
  const searchResults = await publicProfileService.getPublicProfiles({
    search: "Jaipur",
  });
  assert.ok(searchResults.length >= 1);
  assert.ok(searchResults.some((p) => p.username === "priya_travels"));
});

// ==============================================================================
// 5. Database Migration File Verification
// ==============================================================================

test("Database Migration: 20241011000000_public_profiles.sql enforces RLS and CHECK constraints", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase",
    "migrations",
    "20241011000000_public_profiles.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist on disk");

  const content = fs.readFileSync(migrationPath, "utf-8");

  // Verify RLS enablement
  assert.ok(
    content.includes("ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;"),
    "Must enable Row Level Security on public_profiles"
  );

  // Verify Clean-Format CHECK constraints
  assert.ok(
    content.includes("chk_public_profile_username_clean"),
    "Must have username regex check constraint"
  );
  assert.ok(
    content.includes("chk_public_profile_display_name_clean"),
    "Must have display_name clean check constraint"
  );
  assert.ok(
    content.includes("chk_public_profile_bio_clean"),
    "Must have bio clean check constraint"
  );
  assert.ok(
    content.includes("chk_public_profile_travel_style"),
    "Must have travel_style enum check constraint"
  );
  assert.ok(
    content.includes("chk_public_profile_visited_states"),
    "Must have visited_states_count 0-36 check constraint"
  );

  // Verify RLS policies
  assert.ok(content.includes("CREATE POLICY \"Public profiles are readable by everyone when public\""));
  assert.ok(content.includes("CREATE POLICY \"Users can insert their own public profile\""));
  assert.ok(content.includes("CREATE POLICY \"Users can update their own public profile\""));
  assert.ok(content.includes("CREATE POLICY \"Users can delete their own public profile\""));

  // Verify sample profile seed
  assert.ok(content.includes("priya_travels"));
  assert.ok(content.includes("kabir_peaks"));
  assert.ok(content.includes("ananya_coastal"));
  assert.ok(content.includes("vikram_royal"));
  assert.ok(content.includes("zoya_slowroad"));
});
