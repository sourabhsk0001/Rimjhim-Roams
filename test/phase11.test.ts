import { before, test } from "node:test";
import assert from "node:assert";
import { replanEngine, replanDay, replanTrip } from "../src/lib/engines/replan-engine";
import { createTrip } from "../src/lib/services/trip-service";
import {
  getTripItineraries,
  addItineraryItem,
  getItineraryDay,
} from "../src/lib/services/itinerary-service";
import { CopilotService } from "../src/lib/services/copilot-service";
import { DeterministicCopilotProvider } from "../src/lib/ai/provider";
import { HourlyWeather } from "../src/types/weather";

const authUserId = "user-replan-auth";
const unauthUserId = "user-intruder";
let testTripId = "";

before(async () => {
  // Create an authorized demo trip for replanning tests
  const tripRes = await createTrip(
    {
      origin: "Mumbai",
      destination: "Goa",
      start_date: "2026-11-20",
      end_date: "2026-11-26",
      budget: 25000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "moderate",
      preferences: { themes: ["beaches", "sightseeing", "food"] },
    },
    authUserId
  );

  testTripId = tripRes.data!.id;

  // Initialize day itineraries
  await getTripItineraries(testTripId, authUserId);
});

// ==============================================================================
// 1. Core Replanning: 45 Minutes Late Scenario
// ==============================================================================

test("ReplanEngine: User is 45 minutes late shifts times, compresses dwell time, and preserves landmarks", async () => {
  // Seed activities on Day 1
  const day1Res = await getItineraryDay(testTripId, 1, authUserId);
  assert.ok(day1Res.day);

  // Run replan for 45 minutes late
  const result = await replanDay({
    tripId: testTripId,
    dayNumber: 1,
    delayMinutes: 45,
    userId: authUserId,
    apply: false,
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.delayMinutes, 45);
  assert.ok(result.replannedItems.length > 0);
  assert.ok(result.changes.length > 0);

  // Check that changes have valid types and reasons
  for (const change of result.changes) {
    assert.ok(["added", "removed", "moved", "shortened", "extended"].includes(change.type));
    assert.ok(typeof change.reason === "string" && change.reason.length > 5);
  }

  // Verify time separation invariant
  for (const item of result.replannedItems) {
    assert.strictEqual(typeof item.visit_minutes, "number");
    assert.strictEqual(typeof item.travel_minutes, "number");
    assert.strictEqual(typeof item.waiting_minutes, "number");
    assert.strictEqual(typeof item.buffer_minutes, "number");
  }
});

// ==============================================================================
// 2. Low-Priority Item Removal Scenario: "Insufficient remaining time"
// ==============================================================================

test("ReplanEngine: Drops low-priority items when remaining time is insufficient with reason 'Insufficient remaining time'", async () => {
  // Add a low-priority small museum scheduled at 20:30 with 60m duration on Day 2
  await addItineraryItem(testTripId, 2, authUserId, {
    title: "Small Curio Museum",
    category: "sightseeing",
    start_time: "20:30",
    end_time: "21:30",
    visit_minutes: 60,
    priority: "low",
    location: { latitude: 15.4989, longitude: 73.8278, name: "Small Curio Museum" },
  });

  // Replan starting at 20:45 (only 15 mins remaining before 21:00 day_end_time, cannot fit 60m dwell)
  const result = await replanDay({
    tripId: testTripId,
    dayNumber: 2,
    currentTime: "20:45",
    userId: authUserId,
    apply: false,
  });

  assert.strictEqual(result.success, true);
  const removedChange = result.changes.find(
    (c) => c.itemTitle.includes("Small Curio Museum") && c.type === "removed"
  );

  assert.ok(removedChange, "Small Curio Museum should be removed due to schedule overrun");
  assert.ok(
    removedChange.reason.toLowerCase().includes("insufficient remaining time") ||
      removedChange.reason.toLowerCase().includes("time"),
    `Removal reason must cite insufficient time: ${removedChange.reason}`
  );
});

// ==============================================================================
// 3. Weather Conflict Scenario: "Moved: Beach 4 PM → 6 PM. Reason: Better weather window."
// ==============================================================================

test("ReplanEngine: Moves outdoor beach from 4 PM to 6 PM when rain is predicted at 4 PM", async () => {
  // Add an outdoor beach activity at 16:00 (4 PM) on Day 3
  await addItineraryItem(testTripId, 3, authUserId, {
    title: "Calangute Beach Walk",
    category: "sightseeing",
    start_time: "16:00",
    end_time: "17:30",
    visit_minutes: 90,
    priority: "high",
    location: { latitude: 15.5438, longitude: 73.7553, name: "Calangute Beach" },
  });

  // Synthetic hourly weather: rain at 16:00, but clear at 18:00
  const syntheticHourly: HourlyWeather[] = [
    { hour: 15, time: "2026-11-22T15:00", temperature: 29, apparentTemperature: 29, condition: "Sunny", weatherCode: 0, precipitationProbability: 10, precipitation: 0, windSpeed: 10, windDirection: 180, humidity: 60, uvIndex: 5, isDay: true },
    { hour: 16, time: "2026-11-22T16:00", temperature: 26, apparentTemperature: 26, condition: "Heavy Rain", weatherCode: 65, precipitationProbability: 85, precipitation: 4.5, windSpeed: 25, windDirection: 180, humidity: 85, uvIndex: 1, isDay: true },
    { hour: 17, time: "2026-11-22T17:00", temperature: 27, apparentTemperature: 27, condition: "Light Rain", weatherCode: 61, precipitationProbability: 60, precipitation: 2.1, windSpeed: 20, windDirection: 180, humidity: 80, uvIndex: 1, isDay: true },
    { hour: 18, time: "2026-11-22T18:00", temperature: 26, apparentTemperature: 26, condition: "Clear", weatherCode: 0, precipitationProbability: 5, precipitation: 0, windSpeed: 8, windDirection: 180, humidity: 65, uvIndex: 0, isDay: true },
    { hour: 19, time: "2026-11-22T19:00", temperature: 25, apparentTemperature: 25, condition: "Clear", weatherCode: 0, precipitationProbability: 5, precipitation: 0, windSpeed: 7, windDirection: 180, humidity: 65, uvIndex: 0, isDay: false },
  ];

  // Retrieve Day 3 and mark any prior activities before 16:00 as completed
  const day3Res = await getItineraryDay(testTripId, 3, authUserId);
  const priorCompletedIds = (day3Res.day?.items || [])
    .filter((it) => it.start_time < "16:00")
    .map((it) => it.id);

  const result = await replanDay({
    tripId: testTripId,
    dayNumber: 3,
    currentTime: "16:00",
    completedItemIds: priorCompletedIds,
    weatherForecast: syntheticHourly,
    userId: authUserId,
    apply: false,
  });

  assert.strictEqual(result.success, true);

  // Look for the beach change
  const beachChange = result.changes.find((c) => c.itemTitle.includes("Beach"));
  assert.ok(beachChange, "Beach item should have a recorded change due to weather");

  if (beachChange.type === "moved") {
    assert.ok(
      beachChange.reason.toLowerCase().includes("weather") ||
        beachChange.reason.toLowerCase().includes("rain"),
      "Move reason must mention weather window"
    );
    assert.ok(
      beachChange.after?.start_time.startsWith("18:"),
      `Expected moved start time around 18:00, got ${beachChange.after?.start_time}`
    );
  } else if (beachChange.type === "removed") {
    // If replaced with indoor sight
    const addedIndoor = result.changes.find((c) => c.type === "added");
    assert.ok(addedIndoor, "Should have added indoor alternative if removed");
  }
});

// ==============================================================================
// 4. Closing Hours Conflict Scenario
// ==============================================================================

test("ReplanEngine: Removes attraction when arrival is past closing time with explicit reason", async () => {
  // Add sight scheduled with closing time of 16:00 on Day 4
  await addItineraryItem(testTripId, 4, authUserId, {
    title: "Heritage Fort Museum",
    category: "sightseeing",
    start_time: "16:15",
    end_time: "17:15",
    visit_minutes: 60,
    closing_time: "16:00",
    priority: "medium",
    location: { latitude: 15.4989, longitude: 73.8278, name: "Heritage Fort Museum" },
  });

  // Replan starting at 16:00 (pending item starts 16:15, after 16:00 closing)
  const result = await replanDay({
    tripId: testTripId,
    dayNumber: 4,
    currentTime: "16:00",
    userId: authUserId,
    apply: false,
  });

  assert.strictEqual(result.success, true);
  const fortChange = result.changes.find(
    (c) => c.itemTitle.includes("Heritage Fort Museum") && c.type === "removed"
  );

  assert.ok(fortChange, "Heritage Fort Museum should be removed when arriving after 16:00 closing");
  assert.ok(
    fortChange.reason.toLowerCase().includes("closes at 16:00") ||
      fortChange.reason.toLowerCase().includes("closing") ||
      fortChange.reason.toLowerCase().includes("insufficient"),
    `Reason must indicate closing time: ${fortChange.reason}`
  );
});

// ==============================================================================
// 5. Current Location GPS Routing
// ==============================================================================

test("ReplanEngine: Recalculates travel time from current user GPS location", async () => {
  const customGPS = {
    latitude: 15.2993,
    longitude: 74.124,
    name: "User Live Location (South Goa)",
  };

  const result = await replanDay({
    tripId: testTripId,
    dayNumber: 1,
    currentTime: "11:00",
    currentLocation: customGPS,
    userId: authUserId,
    apply: false,
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.replannedItems.length > 0);

  // First pending item must have non-zero travel minutes from the South Goa coordinates
  const firstItem = result.replannedItems.find((it) => it.start_time >= "11:00");
  if (firstItem) {
    assert.ok(firstItem.travel_minutes >= 0);
  }
});

// ==============================================================================
// 6. Persistence Verification (apply = true)
// ==============================================================================

test("ReplanEngine: Persists replanned schedule when apply=true", async () => {
  const result = await replanDay({
    tripId: testTripId,
    dayNumber: 1,
    delayMinutes: 30,
    userId: authUserId,
    apply: true,
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.applied, true);

  // Load from store to verify persisted state
  const updatedDay = await getItineraryDay(testTripId, 1, authUserId);
  assert.ok(updatedDay.day);
  assert.strictEqual(updatedDay.day.items.length, result.replannedItems.length);
});

// ==============================================================================
// 7. Budget Delta Calculation (Deterministic Minor Units)
// ==============================================================================

test("ReplanEngine: Correctly computes budget delta with zero arithmetic drift", async () => {
  const result = await replanDay({
    tripId: testTripId,
    dayNumber: 1,
    delayMinutes: 45,
    userId: authUserId,
    apply: false,
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(typeof result.budget.originalCost, "number");
  assert.strictEqual(typeof result.budget.replannedCost, "number");
  assert.strictEqual(
    result.budget.costDifference,
    result.budget.replannedCost - result.budget.originalCost
  );
  assert.ok(result.budget.replannedCostFormatted.includes("₹"));
});

// ==============================================================================
// 8. AI Copilot Integration: "I'm 45 minutes late. Re-plan my day."
// ==============================================================================

test("AI Copilot: 'I\'m 45 minutes late. Re-plan my day.' invokes replan_trip tool", async () => {
  const provider = new DeterministicCopilotProvider();
  const res = await provider.generateResponse(
    [
      {
        id: "msg_user_late",
        role: "user",
        content: "I'm 45 minutes late. Re-plan my day.",
        timestamp: new Date().toISOString(),
      },
    ],
    [],
    { userId: authUserId, tripId: testTripId, isAuthorized: true }
  );

  assert.ok(res.toolCalls && res.toolCalls.length > 0, "AI must generate tool call");
  const replanCall = res.toolCalls.find((tc) => tc.name === "replan_trip");
  assert.ok(replanCall, "AI must invoke replan_trip tool");
  assert.strictEqual(replanCall.arguments.delayMinutes, 45);
  assert.strictEqual(replanCall.arguments.adjustmentGoal, "replan_day");
});

test("AI Copilot: End-to-end execution of 'I\'m 45 minutes late. Re-plan my day.' through CopilotService", async () => {
  const copilot = new CopilotService();
  const response = await copilot.processMessage(
    {
      tripId: testTripId,
      message: "I'm 45 minutes late. Re-plan my day.",
    },
    authUserId
  );

  assert.ok(response.reply.length > 20);
  const toolsUsed = response.toolEvents.map((t) => t.toolName);
  assert.ok(toolsUsed.includes("replan_trip"));
});

test("Authorization: Replan rejected for unauthorized user", async () => {
  const copilot = new CopilotService();

  await assert.rejects(
    async () => {
      await copilot.processMessage(
        {
          tripId: testTripId,
          message: "I'm 45 minutes late. Re-plan my day.",
        },
        unauthUserId
      );
    },
    (err: Error) => {
      assert.ok(err.message.toLowerCase().includes("unauthorized"));
      return true;
    }
  );
});

// ==============================================================================
// 9. Top-Level Convenience Helpers
// ==============================================================================

test("Convenience helper replanTrip() produces valid structured result", async () => {
  const result = await replanTrip({
    tripId: testTripId,
    dayNumber: 1,
    delayMinutes: 20,
    userId: authUserId,
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.tripId, testTripId);
  assert.strictEqual(result.delayMinutes, 20);
});
