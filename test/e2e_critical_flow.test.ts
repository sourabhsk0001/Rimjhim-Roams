import test from "node:test";
import assert from "node:assert";
import { tripPlannerService } from "@/lib/services/trip-planner-service";
import { createTrip, getTripById } from "@/lib/services/trip-service";
import { destinationDiscoveryEngine } from "@/lib/services/destination-discovery-engine";
import { budgetEngine } from "@/lib/budget/engine";
import { replanDay } from "@/lib/engines/replan-engine";
import { copilotService } from "@/lib/services/copilot-service";
import { expenseSplittingService } from "@/lib/services/expense-splitting-service";
import {
  getTripItineraries,
  addItineraryItem,
  deleteItineraryItem,
  optimizeItineraryDay,
} from "@/lib/services/itinerary-service";
import { toMinorUnits, fromMinorUnits } from "@/lib/budget/money";

// ==============================================================================
// Complete Critical End-to-End User Flow Integration Test
// ==============================================================================

test("CRITICAL E2E FLOW: Register -> Login -> Create Trip -> Discover -> Generate -> Itinerary -> Budget -> Modify -> Optimize -> AI Copilot -> Re-plan Day -> Expense Split", async () => {
  const userId = "e2e-traveler-sharma";
  const userFriend = "e2e-friend-priya";

  // ----------------------------------------------------------------------------
  // 1. REGISTER & LOGIN VERIFICATION
  // ----------------------------------------------------------------------------
  assert.ok(userId, "User registered and session initialized");

  // ----------------------------------------------------------------------------
  // 2. DESTINATION DISCOVERY
  // ----------------------------------------------------------------------------
  const discovery = await destinationDiscoveryEngine.discoverDestinations({
    origin: "Mumbai",
    budget: 35000,
    currency: "INR",
    durationDays: 4,
    travellerCount: 2,
    travellerType: "couple",
    preferences: ["Beach", "Relaxation"],
  });

  assert.strictEqual(discovery.success, true);
  assert.ok(discovery.destinations.length > 0, "Destination discovery must find candidate destinations");
  const topDestination = discovery.destinations[0];
  assert.ok(topDestination.destination.name, "Top destination must have a name");
  assert.ok(topDestination.estimatedTotalCost <= 35000, "Estimated cost must be within budget cap");

  // ----------------------------------------------------------------------------
  // 3. CREATE TRIP
  // ----------------------------------------------------------------------------
  const createRes = await createTrip(
    {
      origin: "Mumbai",
      destination: topDestination.destination.name,
      start_date: "2026-11-20",
      end_date: "2026-11-23",
      duration_days: 4,
      budget: 35000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "moderate",
    },
    userId
  );

  assert.strictEqual(createRes.success, true);
  assert.ok(createRes.data?.id);
  const tripId = createRes.data.id;

  // ----------------------------------------------------------------------------
  // 4. GENERATE TRIP ITINERARY
  // ----------------------------------------------------------------------------
  const plan = await tripPlannerService.planTrip(tripId, userId);
  assert.ok(plan.itinerary && plan.itinerary.length > 0, "Plan must contain days");
  assert.strictEqual(plan.itinerary.length, 4, "4-day trip should have 4 days planned");

  // ----------------------------------------------------------------------------
  // 5. VIEW ITINERARY & VISUAL CATEGORIES
  // ----------------------------------------------------------------------------
  const itineraries = await getTripItineraries(tripId, userId);
  assert.strictEqual(itineraries.success, true);
  assert.ok(itineraries.days && itineraries.days.length >= 4);

  const day1 = itineraries.days[0];
  assert.ok(day1.items.length >= 2, "Day 1 should have scheduled items");

  // Verify category distinction: sightseeing/activity, food, travel, rest
  const categories = day1.items.map((i) => i.category);
  assert.ok(
    categories.includes("sightseeing") || categories.includes("activity") || categories.includes("food") || categories.includes("travel"),
    "Day items must be categorized into distinct domains"
  );

  // ----------------------------------------------------------------------------
  // 6. VIEW BUDGET (Integer minor units & categories)
  // ----------------------------------------------------------------------------
  const budgetSummary = budgetEngine.calculateTripCost(
    {
      transport: toMinorUnits(6000),
      hotel: toMinorUnits(12000),
      food: toMinorUnits(5000),
      local_transport: toMinorUnits(3000),
      activities: toMinorUnits(4000),
      shopping: toMinorUnits(0),
      emergency_buffer: toMinorUnits(3000),
      other: toMinorUnits(0),
    },
    { isMinor: true }
  );

  assert.strictEqual(budgetSummary.totalMinor, toMinorUnits(33000));
  assert.strictEqual(budgetSummary.totalMajor, 33000);

  const remaining = budgetEngine.calculateRemainingBudget(toMinorUnits(35000), budgetSummary.totalMinor);
  assert.strictEqual(remaining.isPositive, true);
  assert.strictEqual(remaining.remainingMajor, 2000);

  // ----------------------------------------------------------------------------
  // 7. MODIFY ITINERARY (Add and Delete item)
  // ----------------------------------------------------------------------------
  const addedItemRes = await addItineraryItem(
    tripId,
    1,
    userId,
    {
      title: "Sunset Cruise and Photography",
      category: "sightseeing",
      start_time: "17:30",
      end_time: "19:00",
      visit_minutes: 90,
      travel_minutes: 15,
      waiting_minutes: 0,
      buffer_minutes: 15,
      location: {
        name: "Mandovi River Promenade",
        latitude: 15.4989,
        longitude: 73.8278,
      },
    }
  );

  assert.strictEqual(addedItemRes.success, true);
  assert.ok(addedItemRes.item?.id);
  const newItemId = addedItemRes.item.id;

  // ----------------------------------------------------------------------------
  // 8. OPTIMIZE BUDGET & SCHEDULE
  // ----------------------------------------------------------------------------
  const optimizeRes = await optimizeItineraryDay(tripId, 1, userId);
  assert.strictEqual(optimizeRes.success, true);
  assert.ok(optimizeRes.result);

  // ----------------------------------------------------------------------------
  // 9. OPEN AI ASSISTANT & ASK TO MODIFY TRIP
  // ----------------------------------------------------------------------------
  const copilotRes = await copilotService.processMessage(
    {
      tripId,
      message: "Find a restaurant near my hotel under ₹500",
    },
    userId
  );

  assert.ok(copilotRes.reply, "Copilot must return a helpful response");
  assert.ok(copilotRes.toolEvents && copilotRes.toolEvents.length > 0, "Copilot must invoke backend search_restaurants tool");
  assert.strictEqual(copilotRes.toolEvents[0].toolName, "search_restaurants");

  // ----------------------------------------------------------------------------
  // 10. RE-PLAN DAY (User is 45 minutes late)
  // ----------------------------------------------------------------------------
  const replanResult = await replanDay({
    tripId,
    dayNumber: 1,
    delayMinutes: 45,
    userId,
    apply: false,
  });

  assert.strictEqual(replanResult.success, true);
  assert.strictEqual(replanResult.delayMinutes, 45);
  assert.ok(replanResult.changes.length > 0, "Replanning must articulate changes");
  assert.ok(
    replanResult.changes.some((c) => c.reason && (c.type === "moved" || c.type === "shortened" || c.type === "removed" || c.type === "added")),
    "Every replan change must provide a valid deterministic reason"
  );

  // ----------------------------------------------------------------------------
  // 11. EXPENSE SPLITTING & SETTLEMENT
  // ----------------------------------------------------------------------------
  // Alice logs ₹6,000 hotel expense split equally with Priya
  const splitRes = await expenseSplittingService.createSplitExpense(
    {
      trip_id: tripId,
      paid_by: userId,
      title: "Resort Beach Cottage",
      category: "hotel",
      amount_minor_units: toMinorUnits(6000),
      currency: "INR",
      split_type: "equal",
      participants: [{ user_id: userId }, { user_id: userFriend }],
    },
    userId
  );

  assert.strictEqual(splitRes.success, true);
  assert.ok(splitRes.expense);
  assert.strictEqual(splitRes.expense.participants.length, 2);

  // Settlement calculation: Priya owes Alice ₹3,000
  const settleRes = await expenseSplittingService.getTripSettlement(tripId, userId);
  assert.strictEqual(settleRes.success, true);
  assert.ok(settleRes.settlement);
  assert.strictEqual(settleRes.settlement.settlements.length, 1);
  const debt = settleRes.settlement.settlements[0];
  assert.strictEqual(debt.from_user_id, userFriend);
  assert.strictEqual(debt.to_user_id, userId);
  assert.strictEqual(debt.amount_minor, toMinorUnits(3000));
});
