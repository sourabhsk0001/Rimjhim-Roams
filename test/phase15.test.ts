import { before, test } from "node:test";
import assert from "node:assert";
import { travelMemoryService, memoryTravelMemories } from "../src/lib/services/travel-memory-service";
import { DestinationDiscoveryEngine } from "../src/lib/services/destination-discovery-engine";
import { tripPlannerService } from "../src/lib/services/trip-planner-service";
import { toolRegistry } from "../src/lib/ai/tools/registry";
import { createTrip } from "../src/lib/services/trip-service";

const userAlice = "user-phase15-alice";
const userBob = "user-phase15-bob";
const discoveryEngine = new DestinationDiscoveryEngine();

let aliceTripId = "";

before(async () => {
  // Clear memory cache for clean testing
  memoryTravelMemories.delete(userAlice);
  memoryTravelMemories.delete(userBob);

  // Create a trip owned by Alice
  const tripRes = await createTrip(
    {
      origin: "Delhi",
      destination: "Goa",
      start_date: "2026-12-01",
      end_date: "2026-12-06",
      budget: 60000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "moderate",
      preferences: {
        interests: ["beaches"],
      },
    },
    userAlice
  );

  assert.ok(tripRes.data);
  aliceTripId = tripRes.data.id;
});

// ==============================================================================
// 1. Travel Memories CRUD Operations
// ==============================================================================

test("Memories CRUD: Creates, views, edits, and deletes travel memories", async () => {
  // 1. Create Like
  const createdLike = await travelMemoryService.createMemory(userAlice, {
    type: "like",
    category: "destination",
    keyword: "Nature",
    notes: "Loves mountain greenery and coastal flora",
  });
  assert.ok(createdLike.id);
  assert.strictEqual(createdLike.user_id, userAlice);
  assert.strictEqual(createdLike.type, "like");
  assert.strictEqual(createdLike.keyword, "Nature");

  // 2. Create Avoid
  const createdAvoid = await travelMemoryService.createMemory(userAlice, {
    type: "avoid",
    category: "itinerary",
    keyword: "Overpacked itineraries",
    notes: "Requires relaxed pace with ample rest buffers",
  });
  assert.ok(createdAvoid.id);
  assert.strictEqual(createdAvoid.type, "avoid");

  // 3. View (Get all)
  const list = await travelMemoryService.getMemories(userAlice);
  assert.ok(list.length >= 2);
  const foundNature = list.find((m) => m.keyword === "Nature");
  assert.ok(foundNature);

  // 4. View by ID
  const single = await travelMemoryService.getMemoryById(createdLike.id, userAlice);
  assert.ok(single);
  assert.strictEqual(single.keyword, "Nature");

  // 5. Edit (Update)
  const updated = await travelMemoryService.updateMemory(createdLike.id, userAlice, {
    notes: "Updated: Loves mountain landscapes, serene lakes, and forests",
  });
  assert.ok(updated.notes?.includes("serene lakes"));

  // 6. Delete
  const deleted = await travelMemoryService.deleteMemory(createdAvoid.id, userAlice);
  assert.strictEqual(deleted, true);

  const afterDeleteList = await travelMemoryService.getMemories(userAlice);
  assert.strictEqual(afterDeleteList.some((m) => m.id === createdAvoid.id), false);
});

// ==============================================================================
// 2. Sensitive Information Prevention
// ==============================================================================

test("Sensitive Info Guard: Rejects credit cards, passwords, tokens, Aadhaar, and medical records", async () => {
  // Credit card attempt
  await assert.rejects(
    async () => {
      await travelMemoryService.createMemory(userAlice, {
        type: "like",
        category: "general",
        keyword: "My Visa card 4111 1111 1111 1111",
      });
    },
    /Sensitive information detected/
  );

  // Password / Secret attempt
  await assert.rejects(
    async () => {
      await travelMemoryService.createMemory(userAlice, {
        type: "like",
        category: "general",
        keyword: "Wifi password=SecretTraveler123",
      });
    },
    /Sensitive information detected/
  );

  // Aadhaar attempt
  await assert.rejects(
    async () => {
      await travelMemoryService.createMemory(userAlice, {
        type: "like",
        category: "general",
        keyword: "Aadhaar: 2345 6789 0123",
      });
    },
    /Sensitive information detected/
  );

  // Medical diagnosis attempt
  await assert.rejects(
    async () => {
      await travelMemoryService.createMemory(userAlice, {
        type: "like",
        category: "general",
        keyword: "Medical diagnosis prescription for travel",
      });
    },
    /Sensitive information detected/
  );

  // Valid non-sensitive travel tastes must succeed
  const valid = await travelMemoryService.createMemory(userAlice, {
    type: "like",
    category: "restaurant",
    keyword: "Local food",
    notes: "Prefers street food and authentic local recipes",
  });
  assert.strictEqual(valid.keyword, "Local food");
});

// ==============================================================================
// 3. User Authorization & Cross-User Isolation
// ==============================================================================

test("Authorization: Bob cannot view, edit, or delete Alice's travel memories", async () => {
  // Alice adds a memory
  const aliceMem = await travelMemoryService.createMemory(userAlice, {
    type: "like",
    category: "hotel",
    keyword: "Budget hotels",
  });

  // Bob views his own memories - should not contain Alice's memory
  const bobList = await travelMemoryService.getMemories(userBob);
  assert.strictEqual(bobList.some((m) => m.id === aliceMem.id), false);

  // Bob attempts to view Alice's memory by ID
  const bobSingle = await travelMemoryService.getMemoryById(aliceMem.id, userBob);
  assert.strictEqual(bobSingle, null);

  // Bob attempts to edit Alice's memory
  await assert.rejects(
    async () => {
      await travelMemoryService.updateMemory(aliceMem.id, userBob, {
        keyword: "Hacked by Bob",
      });
    },
    /not found or unauthorized/
  );

  // Bob attempts to delete Alice's memory
  const deletedByBob = await travelMemoryService.deleteMemory(aliceMem.id, userBob);
  assert.strictEqual(deletedByBob, false);

  // Verify Alice's memory remains intact
  const aliceCheck = await travelMemoryService.getMemoryById(aliceMem.id, userAlice);
  assert.ok(aliceCheck);
  assert.strictEqual(aliceCheck.keyword, "Budget hotels");
});

// ==============================================================================
// 4. Integration into Destination Discovery
// ==============================================================================

test("Destination Discovery: Boosts destinations matching saved Likes (e.g. Nature)", async () => {
  // Seed Alice's memories: Likes Nature
  await travelMemoryService.createMemory(userAlice, {
    type: "like",
    category: "destination",
    keyword: "Nature",
  });

  const res = await discoveryEngine.discoverDestinations({
    origin: "Delhi",
    budget: 35000,
    currency: "INR",
    durationDays: 4,
    travellerCount: 2,
    travellerType: "couple",
    userId: userAlice,
  });

  assert.strictEqual(res.success, true);
  assert.ok(res.destinations.length > 0);

  // Mountain / scenic destinations (e.g. Manali or Darjeeling) should reflect saved preference
  const scenicDest = res.destinations.find(
    (d) => d.destination.name === "Manali" || d.destination.name === "Darjeeling"
  );
  assert.ok(scenicDest, "Expected scenic destination to be feasible");
  assert.ok(
    scenicDest.matchReasons.some((r) => r.includes("Matches your saved preference: Nature")),
    `Expected match reason to include saved Nature preference, got: ${JSON.stringify(scenicDest.matchReasons)}`
  );
});

test("Destination Discovery: Prioritizes Train travel when saved in transit preferences", async () => {
  // Alice likes Train travel
  await travelMemoryService.createMemory(userAlice, {
    type: "like",
    category: "transit",
    keyword: "Train travel",
  });

  const res = await discoveryEngine.discoverDestinations({
    origin: "Delhi",
    budget: 30000,
    currency: "INR",
    durationDays: 4,
    travellerCount: 2,
    userId: userAlice,
  });

  assert.strictEqual(res.success, true);
  // Nearby or medium-distance destination should feature rail travel
  const railDest = res.destinations.find((d) => d.travelModeSummary.includes("Train") || d.travelModeSummary.includes("Rail"));
  assert.ok(railDest, "Expected at least one destination to prioritize rail transit");
  assert.ok(
    railDest.travelModeSummary.includes("Train travel") || railDest.travelModeSummary.includes("Train"),
    `Expected train travel mode summary, got: ${railDest.travelModeSummary}`
  );
});

// ==============================================================================
// 5. Integration into Hotel Selection
// ==============================================================================

test("Hotel Selection: Likes Budget hotels and Avoids Luxury hotels chooses budget stay even with high budget", async () => {
  // User Alice has high budget (₹60,000 for 5 days), but saved preference:
  // Likes: Budget hotels, Avoids: Luxury hotels
  await travelMemoryService.createMemory(userAlice, {
    type: "like",
    category: "hotel",
    keyword: "Budget hotels",
  });
  await travelMemoryService.createMemory(userAlice, {
    type: "avoid",
    category: "hotel",
    keyword: "Luxury hotels",
  });

  const plan = await tripPlannerService.planTrip(aliceTripId, userAlice);
  assert.ok(plan.hotel);
  assert.ok(
    plan.hotel.pricePerNight <= 3500,
    `Expected budget-friendly nightly rate <= 3500, got: ${plan.hotel.pricePerNight}`
  );
  assert.ok(
    plan.hotel.reason.includes("Budget hotels") || plan.hotel.reason.includes("Luxury hotels"),
    `Expected hotel reason to cite saved preferences, got: ${plan.hotel.reason}`
  );
});

// ==============================================================================
// 6. Integration into Restaurant Selection
// ==============================================================================

test("Restaurant Selection: Likes Local food prioritizes authentic regional dining", async () => {
  await travelMemoryService.createMemory(userAlice, {
    type: "like",
    category: "restaurant",
    keyword: "Local food",
  });

  const plan = await tripPlannerService.planTrip(aliceTripId, userAlice);
  assert.ok(plan.food && plan.food.meals && plan.food.meals.length > 0);

  // Meals should select traditional / regional restaurants rather than continental chains
  const selectedCuisines = plan.food.meals.map((m) => m.restaurant.cuisine.toLowerCase());
  const hasLocalSpecialist = selectedCuisines.some(
    (c) =>
      c.includes("goan") ||
      c.includes("seafood") ||
      c.includes("traditional") ||
      c.includes("indian") ||
      c.includes("regional")
  );
  assert.ok(hasLocalSpecialist, `Expected authentic local cuisines, got: ${selectedCuisines.join(", ")}`);
});

// ==============================================================================
// 7. Integration into Itinerary Planning
// ==============================================================================

test("Itinerary Planning: Avoids Overpacked itineraries forces relaxed pace and caps attractions per day", async () => {
  // Alice saves Avoids: Overpacked itineraries
  await travelMemoryService.createMemory(userAlice, {
    type: "avoid",
    category: "itinerary",
    keyword: "Overpacked itineraries",
  });

  const plan = await tripPlannerService.planTrip(aliceTripId, userAlice);
  assert.ok(plan.itinerary && plan.itinerary.length > 0);

  // For every planned day, attractions should be capped at 2 per day (relaxed pace)
  for (const day of plan.itinerary) {
    const attractionItems = day.items.filter((item) => item.type === "attraction");
    assert.ok(
      attractionItems.length <= 2,
      `Day ${day.dayNumber} has ${attractionItems.length} attractions, exceeding relaxed cap of 2!`
    );
  }
});

// ==============================================================================
// 8. Integration into AI Copilot Context
// ==============================================================================

test("AI Copilot: get_trip_context returns authorized travel memories for current user", async () => {
  const context = {
    userId: userAlice,
    tripId: aliceTripId,
    isAuthorized: true,
  };

  const tripContext = await toolRegistry.executeTool("get_trip_context", { tripId: aliceTripId }, context);
  assert.strictEqual(tripContext.hasActiveTrip, true);
  assert.ok(tripContext.travelMemories, "Expected travelMemories object in trip context");

  const memObj = tripContext.travelMemories as { likes: string[]; avoids: string[]; totalMemories: number };
  assert.ok(Array.isArray(memObj.likes));
  assert.ok(Array.isArray(memObj.avoids));
  assert.ok(memObj.likes.includes("nature") || memObj.likes.includes("local food"));
  assert.ok(memObj.avoids.includes("luxury hotels") || memObj.avoids.includes("overpacked itineraries"));
});

test("AI Copilot: Tool get_travel_memories returns user's memories and rejects unauthorized user", async () => {
  // Authorized call for Alice
  const aliceRes = await toolRegistry.executeTool("get_travel_memories", {}, {
    userId: userAlice,
    isAuthorized: true,
  });
  assert.strictEqual(aliceRes.userId, userAlice);
  assert.ok((aliceRes.count as number) >= 3);

  // Unauthorized call without user session
  await assert.rejects(
    async () => {
      await toolRegistry.executeTool("get_travel_memories", {}, {
        userId: "",
        isAuthorized: false,
      });
    },
    /Unauthorized: User session required/
  );
});

// ==============================================================================
// 9. Deletion Lifecycle Impact
// ==============================================================================

test("Deletion Lifecycle: Deleting memory immediately removes it from future planning and AI context", async () => {
  // Alice adds a unique preference: Kayaking
  const kayakingMem = await travelMemoryService.createMemory(userAlice, {
    type: "like",
    category: "destination",
    keyword: "Kayaking",
  });

  const beforeContext = await toolRegistry.executeTool("get_trip_context", { tripId: aliceTripId }, {
    userId: userAlice,
    tripId: aliceTripId,
    isAuthorized: true,
  });
  const beforeMemories = beforeContext.travelMemories as { likes: string[]; avoids: string[] };
  assert.strictEqual(beforeMemories.likes.includes("kayaking"), true);

  // Alice deletes Kayaking memory
  const deleted = await travelMemoryService.deleteMemory(kayakingMem.id, userAlice);
  assert.strictEqual(deleted, true);

  // AI context after deletion should no longer have kayaking in likes
  const afterContext = await toolRegistry.executeTool("get_trip_context", { tripId: aliceTripId }, {
    userId: userAlice,
    tripId: aliceTripId,
    isAuthorized: true,
  });
  const afterMemories = afterContext.travelMemories as { likes: string[]; avoids: string[] };
  assert.strictEqual(
    afterMemories.likes.includes("kayaking"),
    false,
    "Deleted preference 'kayaking' must no longer appear in likes"
  );
});
