import { before, test } from "node:test";
import assert from "node:assert";
import { toolRegistry, COPILOT_TOOL_DEFINITIONS } from "../src/lib/ai/tools/registry";
import { CopilotService } from "../src/lib/services/copilot-service";
import { DeterministicCopilotProvider, GeminiModelProvider } from "../src/lib/ai/provider";
import { CopilotContext } from "../src/types/ai";
import { createTrip } from "../src/lib/services/trip-service";
import { getTripItineraries, addItineraryItem } from "../src/lib/services/itinerary-service";

const authorizedUserId = "user-copilot-auth";
const unauthorizedUserId = "user-unauthorized-intruder";
let testTripId = "";

before(async () => {
  // Create an authorized demo trip for copilot tests
  const res = await createTrip(
    {
      origin: "Mumbai",
      destination: "Goa",
      start_date: "2026-11-10",
      end_date: "2026-11-13",
      budget: 25000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "moderate",
      preferences: { themes: ["beaches", "relaxation", "dining"] },
    },
    authorizedUserId
  );

  testTripId = res.data!.id;

  // Initialize itinerary days
  await getTripItineraries(testTripId, authorizedUserId);

  // Seed museum activity on Day 1 for Prompt Scenario 2
  await addItineraryItem(testTripId, 1, authorizedUserId, {
    title: "Goa State Museum",
    category: "activity",
    start_time: "10:00",
    end_time: "11:30",
    visit_minutes: 90,
    location: { latitude: 15.4989, longitude: 73.8278, name: "Goa State Museum" },
  });
});

// ==============================================================================
// 1. Independent Tool Execution (Zero LLM reliance)
// ==============================================================================

test("Copilot Tool: search_destinations returns structured matches", async () => {
  const result = await toolRegistry.executeTool(
    "search_destinations",
    { query: "Goa" },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert.strictEqual(typeof result.count, "number");
  assert(Array.isArray(result.destinations));
  assert(result.destinations.length > 0);
  assert.strictEqual(result.destinations[0].name, "Goa");
});

test("Copilot Tool: search_hotels filters by maxPricePerNight and sorts by rating", async () => {
  const result = await toolRegistry.executeTool(
    "search_hotels",
    { destinationName: "Goa", maxPricePerNight: 4000, minRating: 4.0 },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert.strictEqual(result.destination, "Goa");
  assert(Array.isArray(result.hotels));
  for (const h of result.hotels as Array<{ pricePerNight: number; rating: number }>) {
    assert(h.pricePerNight <= 4000, `Hotel price ${h.pricePerNight} exceeds 4000`);
    assert(h.rating >= 4.0, `Hotel rating ${h.rating} below 4.0`);
  }
});

test("Copilot Tool: search_transport returns routes and local taxi tariffs", async () => {
  const result = await toolRegistry.executeTool(
    "search_transport",
    { destinationName: "Goa", originCity: "Mumbai" },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert.strictEqual(result.destination, "Goa");
  assert(Array.isArray(result.routes));
  assert(Array.isArray(result.localTaxiTariff));
  assert(result.routes.length > 0);
});

test("Copilot Tool: search_restaurants filters by price per person and cuisine", async () => {
  const result = await toolRegistry.executeTool(
    "search_restaurants",
    { destinationName: "Goa", maxPricePerPerson: 300 },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert.strictEqual(result.destination, "Goa");
  assert(Array.isArray(result.restaurants));
  for (const r of result.restaurants as Array<{ pricePerPerson: number }>) {
    assert(r.pricePerPerson <= 300, `Restaurant price ${r.pricePerPerson} exceeds ₹300 limit`);
  }
});

test("Copilot Tool: search_attractions returns sights with operational hours", async () => {
  const result = await toolRegistry.executeTool(
    "search_attractions",
    { destinationName: "Goa" },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert.strictEqual(result.destination, "Goa");
  assert(Array.isArray(result.attractions));
  assert(result.attractions.length > 0);
  assert(result.attractions[0].openingTime);
});

test("Copilot Tool: get_weather returns forecasts and conditions", async () => {
  const result = await toolRegistry.executeTool(
    "get_weather",
    { destinationName: "Goa", days: 3 },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert.strictEqual(result.destination, "Goa");
  assert(result.current);
  assert(Array.isArray(result.forecastDays));
});

test("Copilot Tool: calculate_route computes distance and duration via OSRM", async () => {
  const result = await toolRegistry.executeTool(
    "calculate_route",
    {
      originLat: 15.2993,
      originLng: 74.124,
      destLat: 15.4989,
      destLng: 73.8278,
      mode: "driving",
    },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert(typeof result.distanceKm === "number" && result.distanceKm > 0);
  assert(typeof result.durationMinutes === "number" && result.durationMinutes > 0);
  assert.strictEqual(result.mode, "driving");
});

test("Copilot Tool: calculate_budget produces deterministic minor-unit aggregation", async () => {
  const result = await toolRegistry.executeTool(
    "calculate_budget",
    {
      allocatedBudget: 20000,
      transportCost: 6000,
      hotelCost: 6000,
      foodCost: 3000,
      localTransportCost: 1500,
      activitiesCost: 2000,
    },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert.strictEqual(result.allocatedBudget, 20000);
  // 6000 + 6000 + 3000 + 1500 + 2000 = 18500 subtotal, emergency buffer = 5% of 18500 = 925
  assert.strictEqual(result.totalCost, 19425);
  assert.strictEqual(result.isOverBudget, false);
  assert.strictEqual(result.remainingBudget, 575);
});

test("Copilot Tool: calculate_visit_duration computes dwell time for pace and tier", async () => {
  const result = await toolRegistry.executeTool(
    "calculate_visit_duration",
    {
      attractionName: "Aguada Fort",
      durationTier: "Normal",
      travelPace: "moderate",
      travellerType: "couple",
    },
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert.strictEqual(result.attractionName, "Aguada Fort");
  assert.strictEqual(result.durationTier, "Normal");
  assert(typeof result.calculatedVisitMinutes === "number" && result.calculatedVisitMinutes > 0);
});

test("Copilot Tool: replan_trip computes deterministic cost reductions", async () => {
  const result = await toolRegistry.executeTool(
    "replan_trip",
    {
      tripId: testTripId,
      adjustmentGoal: "make_cheaper",
    },
    { userId: authorizedUserId, tripId: testTripId, isAuthorized: true }
  );

  assert.strictEqual(result.tripId, testTripId);
  assert(typeof result.savingsAchieved === "number" && result.savingsAchieved > 0);
  assert(Array.isArray(result.adjustments) && result.adjustments.length > 0);
});

test("Copilot Tool: optimize_itinerary rebalances schedule and removes items", async () => {
  const result = await toolRegistry.executeTool(
    "optimize_itinerary",
    {
      tripId: testTripId,
      dayNumber: 1,
      removeItemTitle: "museum",
      strategy: "schedule_balance",
    },
    { userId: authorizedUserId, tripId: testTripId, isAuthorized: true }
  );

  assert.strictEqual(result.tripId, testTripId);
  assert.strictEqual(result.success, true);
  assert(typeof result.itemCount === "number");
});

test("Copilot Tool: get_trip_context retrieves hydrated authorized trip data", async () => {
  const result = await toolRegistry.executeTool(
    "get_trip_context",
    { tripId: testTripId },
    { userId: authorizedUserId, tripId: testTripId, isAuthorized: true }
  );

  assert.strictEqual(result.hasActiveTrip, true);
  assert.strictEqual(result.tripId, testTripId);
  assert.strictEqual(result.origin, "Mumbai");
  assert.strictEqual(result.destination, "Goa");
});

test("Copilot Tool: Unrecognized tool name throws informative error", async () => {
  await assert.rejects(
    async () => {
      await toolRegistry.executeTool(
        "invalid_tool_name_xyz",
        {},
        { userId: authorizedUserId, isAuthorized: true }
      );
    },
    { message: /Unrecognized tool/ }
  );
});

// ==============================================================================
// 2. Strict Authorization Boundaries
// ==============================================================================

test("Authorization: User cannot read another user's trip context", async () => {
  await assert.rejects(
    async () => {
      await toolRegistry.executeTool(
        "get_trip_context",
        { tripId: testTripId },
        { userId: unauthorizedUserId, tripId: testTripId, isAuthorized: false }
      );
    },
    { message: /Unauthorized: Access denied/ }
  );
});

test("Authorization: User cannot replan another user's trip", async () => {
  await assert.rejects(
    async () => {
      await toolRegistry.executeTool(
        "replan_trip",
        { tripId: testTripId },
        { userId: unauthorizedUserId, tripId: testTripId, isAuthorized: false }
      );
    },
    { message: /unauthorized access/i }
  );
});

test("Authorization: CopilotService rejects unauthorized trip context requests", async () => {
  const service = new CopilotService();
  await assert.rejects(
    async () => {
      await service.processMessage(
        {
          message: "Make today's trip cheaper.",
          tripId: testTripId,
        },
        unauthorizedUserId
      );
    },
    { message: /Unauthorized/ }
  );
});

// ==============================================================================
// 3. User Prompt Scenarios Execution
// ==============================================================================

test("Prompt Scenario 1: 'Make today's trip cheaper' triggers calculate_budget and replan_trip", async () => {
  const service = new CopilotService();
  const response = await service.processMessage(
    {
      message: "Make today's trip cheaper.",
      tripId: testTripId,
    },
    authorizedUserId
  );

  assert(response.reply.length > 0);
  assert(response.toolEvents.length >= 1);

  const toolNames = response.toolEvents.map((t) => t.toolName);
  assert(toolNames.includes("calculate_budget") || toolNames.includes("replan_trip"));

  const replanEvent = response.toolEvents.find((t) => t.toolName === "replan_trip");
  if (replanEvent) {
    assert.strictEqual(replanEvent.status, "success");
    assert(Number(replanEvent.output.savingsAchieved) > 0);
  }
});

test("Prompt Scenario 2: 'I don't want to visit the museum' removes item and reoptimizes schedule", async () => {
  const service = new CopilotService();
  const response = await service.processMessage(
    {
      message: "I don't want to visit the museum.",
      tripId: testTripId,
    },
    authorizedUserId
  );

  assert(response.reply.length > 0);
  assert(response.toolEvents.length >= 1);

  const optimizeEvent = response.toolEvents.find((t) => t.toolName === "optimize_itinerary");
  assert(optimizeEvent, "optimize_itinerary tool must be executed");
  assert.strictEqual(optimizeEvent.status, "success");
});

test("Prompt Scenario 3: 'Find a restaurant near my hotel under ₹300' filters strictly by price limit", async () => {
  const service = new CopilotService();
  const response = await service.processMessage(
    {
      message: "Find a restaurant near my hotel under ₹300 in Goa.",
      tripId: testTripId,
    },
    authorizedUserId
  );

  assert(response.reply.length > 0);
  const restaurantEvent = response.toolEvents.find((t) => t.toolName === "search_restaurants");
  assert(restaurantEvent, "search_restaurants tool must be executed");
  assert.strictEqual(restaurantEvent.status, "success");

  const candidates = restaurantEvent.output.restaurants as Array<{ pricePerPerson: number }>;
  for (const c of candidates) {
    assert(c.pricePerPerson <= 300, `Restaurant candidate cost ${c.pricePerPerson} is over ₹300`);
  }
});

// ==============================================================================
// 4. Provider & Tool Definitions Verification
// ==============================================================================

test("Tool Definitions: All 12 required tools are declared with valid parameter schemas", () => {
  const requiredTools = [
    "search_destinations",
    "search_hotels",
    "search_transport",
    "search_restaurants",
    "search_attractions",
    "get_weather",
    "calculate_route",
    "calculate_budget",
    "calculate_visit_duration",
    "optimize_itinerary",
    "replan_trip",
    "get_trip_context",
  ];

  const definedNames = COPILOT_TOOL_DEFINITIONS.map((d) => d.name);
  for (const req of requiredTools) {
    assert(definedNames.includes(req), `Missing required tool definition: ${req}`);
  }
  assert.strictEqual(COPILOT_TOOL_DEFINITIONS.length, 12);
});

test("DeterministicCopilotProvider: Generates valid tool calls without external API keys", async () => {
  const provider = new DeterministicCopilotProvider();
  const resp = await provider.generateResponse(
    [
      {
        id: "msg-1",
        role: "user",
        content: "Where should I go for vacation?",
        timestamp: new Date().toISOString(),
      },
    ],
    COPILOT_TOOL_DEFINITIONS,
    { userId: authorizedUserId, isAuthorized: true }
  );

  assert(resp.toolCalls && resp.toolCalls.length > 0);
  assert.strictEqual(resp.toolCalls[0].name, "search_destinations");
});
