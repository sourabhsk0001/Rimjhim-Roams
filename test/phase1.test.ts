import test from "node:test";
import assert from "node:assert";
import { validateTripInput } from "@/lib/validation/trip";
import {
  createTrip,
  getUserTrips,
  getTripById,
  deleteTrip,
} from "@/lib/services/trip-service";

// ==============================================================================
// 1. Validation Tests
// ==============================================================================

test("Validation: requires origin", () => {
  const result = validateTripInput({
    origin: "",
    destination: "Paris",
    start_date: "2026-10-01",
    end_date: "2026-10-05",
    budget: 1000,
    traveller_count: 1,
  });

  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.origin, "Should have error for missing origin");
});

test("Validation: converts empty destination to 'destination discovery required'", () => {
  const result = validateTripInput({
    origin: "New Delhi",
    destination: "   ",
    start_date: "2026-10-01",
    end_date: "2026-10-05",
    budget: 1200,
    traveller_count: 2,
  });

  assert.strictEqual(result.valid, true);
  assert.strictEqual(
    result.sanitized?.destination,
    "destination discovery required",
    "Empty destination must fallback to 'destination discovery required'"
  );
});

test("Validation: rejects end date before start date", () => {
  const result = validateTripInput({
    origin: "Tokyo",
    destination: "Kyoto",
    start_date: "2026-10-10",
    end_date: "2026-10-05",
    budget: 500,
    traveller_count: 1,
  });

  assert.strictEqual(result.valid, false);
  assert.ok(
    result.errors.end_date,
    "Should reject end date earlier than start date"
  );
});

test("Validation: rejects negative budget", () => {
  const result = validateTripInput({
    origin: "Berlin",
    destination: "Munich",
    start_date: "2026-10-01",
    end_date: "2026-10-03",
    budget: -50,
    traveller_count: 1,
  });

  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.budget, "Should reject negative budget");
});

test("Validation: rejects non-positive traveller count", () => {
  const result = validateTripInput({
    origin: "London",
    destination: "Edinburgh",
    start_date: "2026-10-01",
    end_date: "2026-10-03",
    budget: 600,
    traveller_count: 0,
  });

  assert.strictEqual(result.valid, false);
  assert.ok(
    result.errors.traveller_count,
    "Should reject traveller count less than 1"
  );
});

// ==============================================================================
// 2. Trip Creation Tests
// ==============================================================================

test("Trip Creation: successfully creates and persists trip", async () => {
  const userId = "user-alice";
  const result = await createTrip(
    {
      origin: "Mumbai",
      destination: "Goa",
      start_date: "2026-11-01",
      end_date: "2026-11-05",
      budget: 800,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "relaxed",
    },
    userId
  );

  assert.strictEqual(result.success, true);
  assert.ok(result.data?.id, "Should have a generated ID");
  assert.strictEqual(result.data?.origin, "Mumbai");
  assert.strictEqual(result.data?.destination, "Goa");
  assert.strictEqual(result.data?.duration_days, 5);
  assert.strictEqual(result.data?.status, "planning");
});

// ==============================================================================
// 3. Trip Retrieval & Categorization Tests
// ==============================================================================

test("Trip Retrieval: segregates upcoming and previous trips by date", async () => {
  const userId = "user-bob";

  // Create an upcoming trip
  await createTrip(
    {
      origin: "San Francisco",
      destination: "Yosemite",
      start_date: "2028-06-01",
      end_date: "2028-06-04",
      budget: 1500,
      traveller_count: 1,
    },
    userId
  );

  // Create a past trip
  await createTrip(
    {
      origin: "New York",
      destination: "Boston",
      start_date: "2020-01-10",
      end_date: "2020-01-12",
      budget: 400,
      traveller_count: 1,
    },
    userId
  );

  const { upcoming, previous } = await getUserTrips(userId);

  assert.ok(
    upcoming.some((t) => t.destination === "Yosemite"),
    "Yosemite should be in upcoming trips"
  );
  assert.ok(
    previous.some((t) => t.destination === "Boston"),
    "Boston should be in previous trips"
  );
});

// ==============================================================================
// 4. Authorization Tests
// ==============================================================================

test("Authorization: user cannot access another user's private trip", async () => {
  const ownerId = "user-charlie";
  const strangerId = "user-eve";

  const createResult = await createTrip(
    {
      origin: "Rome",
      destination: "Florence",
      start_date: "2027-04-10",
      end_date: "2027-04-15",
      budget: 1200,
      traveller_count: 1,
    },
    ownerId
  );

  const tripId = createResult.data?.id;
  assert.ok(tripId);

  // Owner access
  const ownerAccess = await getTripById(tripId, ownerId);
  assert.strictEqual(ownerAccess.isAuthorized, true);
  assert.ok(ownerAccess.trip);

  // Stranger access
  const strangerAccess = await getTripById(tripId, strangerId);
  assert.strictEqual(strangerAccess.isAuthorized, false);
  assert.strictEqual(strangerAccess.trip, null);
});

test("Authorization: stranger cannot delete another user's trip", async () => {
  const ownerId = "user-owner-1";
  const strangerId = "user-stranger-2";

  const createResult = await createTrip(
    {
      origin: "Madrid",
      destination: "Barcelona",
      start_date: "2027-05-01",
      end_date: "2027-05-05",
      budget: 900,
      traveller_count: 1,
    },
    ownerId
  );

  const tripId = createResult.data?.id;
  assert.ok(tripId);

  // Stranger attempt
  const deleteByStranger = await deleteTrip(tripId, strangerId);
  assert.strictEqual(deleteByStranger.success, false);

  // Owner attempt
  const deleteByOwner = await deleteTrip(tripId, ownerId);
  assert.strictEqual(deleteByOwner.success, true);
});

// ==============================================================================
// 5. Authentication Protection Logic Tests
// ==============================================================================

test("Auth Protection: redirects unauthenticated users on protected paths", () => {
  function checkRouteAccess(pathname: string, hasSession: boolean) {
    const isProtected =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/trips");

    const isAuthRoute =
      pathname.startsWith("/login") || pathname.startsWith("/register");

    if (!hasSession && isProtected) {
      return { redirect: `/login?redirectTo=${encodeURIComponent(pathname)}` };
    }
    if (hasSession && isAuthRoute) {
      return { redirect: "/dashboard" };
    }
    return { allow: true };
  }

  // Unauthenticated checks
  assert.deepStrictEqual(checkRouteAccess("/dashboard", false), {
    redirect: "/login?redirectTo=%2Fdashboard",
  });
  assert.deepStrictEqual(checkRouteAccess("/profile", false), {
    redirect: "/login?redirectTo=%2Fprofile",
  });
  assert.deepStrictEqual(checkRouteAccess("/trips/new", false), {
    redirect: "/login?redirectTo=%2Ftrips%2Fnew",
  });

  // Public checks
  assert.deepStrictEqual(checkRouteAccess("/", false), { allow: true });

  // Authenticated checks
  assert.deepStrictEqual(checkRouteAccess("/dashboard", true), { allow: true });
  assert.deepStrictEqual(checkRouteAccess("/login", true), {
    redirect: "/dashboard",
  });
});
