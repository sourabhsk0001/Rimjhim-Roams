import test from "node:test";
import assert from "node:assert";
import { tripPlannerService } from "@/lib/services/trip-planner-service";
import { timeToMinutes } from "@/lib/time/engine";
import { TripPlannerInput } from "@/types/planner";

// ==============================================================================
// Phase 6 Complete Trip Planner Unit & End-to-End Test Suite
// ==============================================================================

test("TripPlannerService: Destination resolution handles names, IDs and partial queries", async () => {
  const planGoa = await tripPlannerService.generateCompletePlan({
    tripId: "test-trip-goa",
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 25000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  assert.strictEqual(planGoa.destination.name, "Goa");
  assert.strictEqual(planGoa.destination.country, "India");

  const planJaipur = await tripPlannerService.generateCompletePlan({
    tripId: "test-trip-jaipur",
    userId: "user-1",
    origin: "Delhi",
    destination: "dest-jaipur",
    startDate: "2026-12-05",
    durationDays: 2,
    budget: 20000,
    travellerCount: 1,
    travellerType: "solo",
    travelPace: "relaxed",
  });

  assert.strictEqual(planJaipur.destination.name, "Jaipur");
  assert.strictEqual(planJaipur.destination.state_province, "Rajasthan");
});

test("TripPlannerService: Hotel selection computes rooms, nights and total cost", async () => {
  // Couple (2 people) -> 1 room, 3 days -> 2 nights
  const planCouple = await tripPlannerService.generateCompletePlan({
    tripId: "test-hotel-couple",
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 30000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  assert.strictEqual(planCouple.hotel.roomCount, 1);
  assert.strictEqual(planCouple.hotel.nights, 2);
  assert.strictEqual(
    planCouple.hotel.totalCost,
    planCouple.hotel.pricePerNight * planCouple.hotel.nights * planCouple.hotel.roomCount
  );
  assert(planCouple.hotel.selected.rating >= 4.0);

  // Group of 5 friends -> 3 rooms, 4 days -> 3 nights
  const planGroup = await tripPlannerService.generateCompletePlan({
    tripId: "test-hotel-group",
    userId: "user-1",
    origin: "Delhi",
    destination: "Jaipur",
    startDate: "2026-11-10",
    durationDays: 4,
    budget: 60000,
    travellerCount: 5,
    travellerType: "friends",
    travelPace: "moderate",
  });

  assert.strictEqual(planGroup.hotel.roomCount, 3);
  assert.strictEqual(planGroup.hotel.nights, 3);
  assert.strictEqual(
    planGroup.hotel.totalCost,
    planGroup.hotel.pricePerNight * 3 * 3
  );
});

test("TripPlannerService: Attraction selection scales with pace and calculates visit durations", async () => {
  // Relaxed pace -> 2 attractions / day
  const planRelaxed = await tripPlannerService.generateCompletePlan({
    tripId: "test-pace-relaxed",
    userId: "user-1",
    origin: "Kolkata",
    destination: "Darjeeling",
    startDate: "2026-11-01",
    durationDays: 2,
    budget: 20000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "relaxed",
  });

  assert.strictEqual(planRelaxed.attractions.length, 4); // 2 days * 2 = 4
  assert(planRelaxed.attractions.every((a) => a.durationTier === "Relaxed"));
  assert(planRelaxed.attractions.every((a) => a.visitMinutes >= 45));

  // Fast pace -> 4 attractions / day
  const planFast = await tripPlannerService.generateCompletePlan({
    tripId: "test-pace-fast",
    userId: "user-1",
    origin: "Kolkata",
    destination: "Darjeeling",
    startDate: "2026-11-01",
    durationDays: 2,
    budget: 20000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "fast",
  });

  assert.strictEqual(planFast.attractions.length, 8); // 2 days * 4 = 8
  assert(planFast.attractions.every((a) => a.durationTier === "Quick"));
});

test("TripPlannerService: Food & dining schedules lunch and dinner for each day", async () => {
  const plan = await tripPlannerService.generateCompletePlan({
    tripId: "test-food",
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 25000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  assert.strictEqual(plan.food.meals.length, 6); // 3 days * 2 meals (lunch + dinner) = 6
  const lunches = plan.food.meals.filter((m) => m.mealType === "lunch");
  const dinners = plan.food.meals.filter((m) => m.mealType === "dinner");
  assert.strictEqual(lunches.length, 3);
  assert.strictEqual(dinners.length, 3);
  assert(plan.food.totalCost > 0);
  assert(typeof plan.food.totalCostFormatted === "string");
});

test("TripPlannerService: Transport selection handles intercity and local transit", async () => {
  const plan = await tripPlannerService.generateCompletePlan({
    tripId: "test-transport",
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 35000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  assert(plan.transport.outbound !== undefined);
  assert(plan.transport.intercityCost > 0);
  assert(plan.transport.localCost > 0);
  assert.strictEqual(
    plan.transport.totalCost,
    plan.transport.intercityCost + plan.transport.localCost
  );
});

test("Architectural Invariant: Day schedule keeps visit, travel, waiting, and buffer strictly separate", async () => {
  const plan = await tripPlannerService.generateCompletePlan({
    tripId: "test-time-invariant",
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 2,
    budget: 25000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  for (const day of plan.itinerary) {
    assert(day.totalVisitMinutes > 0, "Daily visit minutes must be positive");
    assert(day.totalTravelMinutes > 0, "Daily travel minutes must be positive");
    assert(day.totalBufferMinutes > 0, "Daily buffer minutes must be positive");

    for (const item of day.items) {
      assert(typeof item.visit_minutes === "number");
      assert(typeof item.travel_minutes === "number");
      assert(typeof item.waiting_minutes === "number");
      assert(typeof item.buffer_minutes === "number");

      // Verify they are discrete distinct fields
      assert(item.visit_minutes >= 15);
      assert(item.travel_minutes >= 0);
      assert(item.waiting_minutes >= 0);
      assert(item.buffer_minutes >= 0);
    }
  }
});

test("TripPlannerService: Respects attraction opening and closing hours", async () => {
  const plan = await tripPlannerService.generateCompletePlan({
    tripId: "test-opening-hours",
    userId: "user-1",
    origin: "Delhi",
    destination: "Jaipur",
    startDate: "2026-11-01",
    durationDays: 2,
    budget: 25000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  for (const day of plan.itinerary) {
    for (const item of day.items) {
      if (item.opening_time && item.closing_time) {
        const itemStart = timeToMinutes(item.start_time);
        const itemEnd = timeToMinutes(item.end_time);
        const openMin = timeToMinutes(item.opening_time);
        const closeMin = timeToMinutes(item.closing_time);

        assert(
          itemStart >= openMin,
          `Item ${item.title} starts at ${item.start_time} before opening ${item.opening_time}`
        );
        assert(
          itemEnd <= closeMin + 30, // allowable buffer window
          `Item ${item.title} ends at ${item.end_time} after closing ${item.closing_time}`
        );
      }
    }
  }
});

test("TripPlannerService: Daily schedule passes validation with zero impossible conflicts", async () => {
  const plan = await tripPlannerService.generateCompletePlan({
    tripId: "test-schedule-validation",
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 25000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  for (const day of plan.itinerary) {
    assert(
      day.validation.isValid === true,
      `Day ${day.dayNumber} failed validation: ${day.validation.errors.map((e) => e.message).join(", ")}`
    );
    assert.strictEqual(day.validation.errors.length, 0);
  }
});

test("TripPlannerService: Deterministic budget calculation aggregates all 8 categories", async () => {
  const plan = await tripPlannerService.generateCompletePlan({
    tripId: "test-budget-breakdown",
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 30000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  const categories = plan.budget.categories;
  assert(categories.transport !== undefined);
  assert(categories.hotel !== undefined);
  assert(categories.food !== undefined);
  assert(categories.local_transport !== undefined);
  assert(categories.activities !== undefined);
  assert(categories.shopping !== undefined);
  assert(categories.emergency_buffer !== undefined);
  assert(categories.other !== undefined);

  const sumCategories =
    categories.transport.amount +
    categories.hotel.amount +
    categories.food.amount +
    categories.local_transport.amount +
    categories.activities.amount +
    categories.shopping.amount +
    categories.emergency_buffer.amount +
    categories.other.amount;

  assert.strictEqual(sumCategories, plan.budget.totalCost);
  assert.strictEqual(
    plan.budget.remainingBudget,
    plan.budget.allocatedBudget - plan.budget.totalCost
  );
});

test("TripPlannerService: Budget optimization applies deterministic adjustments when over budget", async () => {
  // Intentionally set very tight budget of ₹12,000 for 3 days in Goa for 2 people
  const plan = await tripPlannerService.generateCompletePlan({
    tripId: "test-budget-optimizer",
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 12000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  // Check that optimization was invoked
  assert.strictEqual(plan.optimization.wasOptimized, true);
  assert(plan.optimization.appliedAdjustments.length > 0);
  assert(plan.optimization.optimizedCost <= plan.optimization.originalCost);
});

test("TripPlannerService: Complete end-to-end plan generation and cache retrieval", async () => {
  const tripId = "test-e2e-complete-trip";
  const plan = await tripPlannerService.generateCompletePlan({
    tripId,
    userId: "user-1",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 25000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  assert.strictEqual(plan.success, true);
  assert.strictEqual(plan.tripId, tripId);
  assert(plan.itinerary.length === 3);
  assert(plan.planningSteps.length >= 6);
  assert(plan.planningSteps.every((s) => s.completed === true));

  // Retrieve cached plan
  const cached = await tripPlannerService.getPlannedTrip(tripId);
  assert(cached !== null);
  assert.strictEqual(cached?.tripId, tripId);
  assert.strictEqual(cached?.destination.name, "Goa");
});
