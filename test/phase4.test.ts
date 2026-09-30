import test from "node:test";
import assert from "node:assert";
import {
  toMinorUnits,
  fromMinorUnits,
  addMinor,
  subtractMinor,
  multiplyMinor,
  percentageMinor,
  formatCurrency,
} from "@/lib/budget/money";
import { BudgetEngine, budgetEngine } from "@/lib/budget/engine";
import {
  generateDeterministicAlternatives,
  applyOptimizationAlternative,
} from "@/lib/budget/optimizer";
import {
  addTripExpense,
  getTripExpenses,
  deleteTripExpense,
  getTripBudgetDetails,
} from "@/lib/services/budget-service";
import { createTrip } from "@/lib/services/trip-service";
import { OptimizationProfile, BudgetCategory } from "@/types/budget";

// ==============================================================================
// 1. Integer Minor Units & Floating-Point Precision Tests
// ==============================================================================

test("Currency Precision: converts major to integer minor units correctly", () => {
  assert.strictEqual(toMinorUnits(20000), 2000000);
  assert.strictEqual(toMinorUnits(19500.5), 1950050);
  assert.strictEqual(toMinorUnits(0.1), 10);
  assert.strictEqual(toMinorUnits(0.2), 20);
});

test("Currency Precision: zero floating-point drift on 0.1 + 0.2", () => {
  // In IEEE 754 floating point: 0.1 + 0.2 = 0.30000000000000004
  const aMinor = toMinorUnits(0.1); // 10
  const bMinor = toMinorUnits(0.2); // 20
  const sumMinor = addMinor(aMinor, bMinor); // 30
  const sumMajor = fromMinorUnits(sumMinor); // 0.30

  assert.strictEqual(sumMinor, 30);
  assert.strictEqual(sumMajor, 0.3);
});

test("Currency Formatting: produces clean localized currency strings", () => {
  assert.strictEqual(formatCurrency(20000, { currency: "INR" }), "₹20,000");
  assert.strictEqual(
    formatCurrency(2000000, { isMinor: true, currency: "INR" }),
    "₹20,000"
  );
  assert.strictEqual(
    formatCurrency(-150000, { isMinor: true, currency: "INR" }),
    "-₹1,500"
  );
});

// ==============================================================================
// 2. BudgetEngine: All 9 Core Functions
// ==============================================================================

test("BudgetEngine: calculateTransportCost calculates fares in minor units", () => {
  const result = budgetEngine.calculateTransportCost({
    pricePerPerson: 1500,
    travellerCount: 4,
  });

  assert.strictEqual(result.majorUnits, 6000);
  assert.strictEqual(result.minorUnits, 600000);
  assert.strictEqual(result.itemCount, 4);
  assert.strictEqual(result.formatted, "₹6,000");
});

test("BudgetEngine: calculateHotelCost calculates room nights in minor units", () => {
  const result = budgetEngine.calculateHotelCost({
    pricePerNight: 2000,
    nights: 3,
    roomCount: 1,
  });

  assert.strictEqual(result.majorUnits, 6000);
  assert.strictEqual(result.minorUnits, 600000);
  assert.strictEqual(result.nights, 3);
  assert.strictEqual(result.roomCount, 1);
  assert.strictEqual(result.formatted, "₹6,000");
});

test("BudgetEngine: calculateFoodCost calculates daily meals per person", () => {
  const result = budgetEngine.calculateFoodCost({
    dailyCostPerPerson: 750,
    travellerCount: 1,
    durationDays: 4,
  });

  assert.strictEqual(result.majorUnits, 3000);
  assert.strictEqual(result.minorUnits, 300000);
  assert.strictEqual(result.formatted, "₹3,000");
});

test("BudgetEngine: calculateLocalTransportCost calculates local transit", () => {
  const result = budgetEngine.calculateLocalTransportCost({
    dailyCost: 375,
    durationDays: 4,
  });

  assert.strictEqual(result.majorUnits, 1500);
  assert.strictEqual(result.minorUnits, 150000);
  assert.strictEqual(result.formatted, "₹1,500");
});

test("BudgetEngine: calculateActivityCost aggregates ticket admissions", () => {
  const result = budgetEngine.calculateActivityCost({
    activities: [
      { ticketPrice: 500, travellerCount: 2 },
      { ticketPrice: 500, travellerCount: 2 },
    ],
  });

  assert.strictEqual(result.majorUnits, 2000);
  assert.strictEqual(result.minorUnits, 200000);
  assert.strictEqual(result.activityCount, 2);
  assert.strictEqual(result.formatted, "₹2,000");
});

test("BudgetEngine: calculateEmergencyBuffer computes buffer percentage", () => {
  const result = budgetEngine.calculateEmergencyBuffer({
    totalBudgetMinor: toMinorUnits(20000),
    percentage: 5, // 5% of 20000 = 1000
  });

  assert.strictEqual(result.majorUnits, 1000);
  assert.strictEqual(result.minorUnits, 100000);
  assert.strictEqual(result.percentage, 5);
  assert.strictEqual(result.formatted, "₹1,000");
});

test("BudgetEngine: calculateTripCost aggregates all 8 categories", () => {
  const categoryCosts = {
    transport: toMinorUnits(6000),
    hotel: toMinorUnits(6000),
    food: toMinorUnits(3000),
    local_transport: toMinorUnits(1500),
    activities: toMinorUnits(2000),
    shopping: toMinorUnits(0),
    emergency_buffer: toMinorUnits(1000),
    other: toMinorUnits(0),
  };

  const result = budgetEngine.calculateTripCost(categoryCosts, { isMinor: true });

  assert.strictEqual(result.totalMajor, 19500);
  assert.strictEqual(result.totalMinor, 1950000);
  assert.strictEqual(result.formatted, "₹19,500");
  assert.strictEqual(result.categories.transport.majorUnits, 6000);
  assert.strictEqual(result.categories.hotel.majorUnits, 6000);
  assert.strictEqual(result.categories.food.majorUnits, 3000);
  assert.strictEqual(result.categories.local_transport.majorUnits, 1500);
  assert.strictEqual(result.categories.activities.majorUnits, 2000);
  assert.strictEqual(result.categories.emergency_buffer.majorUnits, 1000);
});

test("BudgetEngine: calculateRemainingBudget calculates positive surplus and deficit", () => {
  // Case A: Within budget
  const surplus = budgetEngine.calculateRemainingBudget(
    toMinorUnits(20000),
    toMinorUnits(19500)
  );
  assert.strictEqual(surplus.remainingMajor, 500);
  assert.strictEqual(surplus.remainingMinor, 50000);
  assert.strictEqual(surplus.isPositive, true);
  assert.strictEqual(surplus.formatted, "₹500");

  // Case B: Deficit
  const deficit = budgetEngine.calculateRemainingBudget(
    toMinorUnits(20000),
    toMinorUnits(24000)
  );
  assert.strictEqual(deficit.remainingMajor, -4000);
  assert.strictEqual(deficit.isPositive, false);
  assert.strictEqual(deficit.formatted, "-₹4,000");
});

test("BudgetEngine: calculateOverBudget detects excess and calculates percentage", () => {
  // Case A: Under budget
  const under = budgetEngine.calculateOverBudget(
    toMinorUnits(20000),
    toMinorUnits(19500)
  );
  assert.strictEqual(under.isOverBudget, false);
  assert.strictEqual(under.overBudgetMajor, 0);

  // Case B: Over budget
  const over = budgetEngine.calculateOverBudget(
    toMinorUnits(20000),
    toMinorUnits(25000)
  );
  assert.strictEqual(over.isOverBudget, true);
  assert.strictEqual(over.overBudgetMajor, 5000);
  assert.strictEqual(over.overBudgetMinor, 500000);
  assert.strictEqual(over.percentageOver, 25.0);
  assert.strictEqual(over.formatted, "₹5,000");
});

// ==============================================================================
// 3. Prompt Exact Example Verification
// ==============================================================================

test("Prompt Example Match: Budget ₹20,000 -> Total ₹19,500 with exact breakdown", () => {
  const result = budgetEngine.calculateFullTripBudget({
    totalBudget: 20000,
    isMinor: false,
    categoryCosts: {
      transport: toMinorUnits(6000),
      hotel: toMinorUnits(6000),
      food: toMinorUnits(3000),
      local_transport: toMinorUnits(1500),
      activities: toMinorUnits(2000),
      emergency_buffer: toMinorUnits(1000),
      shopping: toMinorUnits(0),
      other: toMinorUnits(0),
    },
  });

  assert.strictEqual(result.budgetFormatted, "₹20,000");
  assert.strictEqual(result.categories.transport.formatted, "₹6,000");
  assert.strictEqual(result.categories.hotel.formatted, "₹6,000");
  assert.strictEqual(result.categories.food.formatted, "₹3,000");
  assert.strictEqual(result.categories.local_transport.formatted, "₹1,500");
  assert.strictEqual(result.categories.activities.formatted, "₹2,000");
  assert.strictEqual(result.categories.emergency_buffer.formatted, "₹1,000");

  assert.strictEqual(result.totalCostFormatted, "₹19,500");
  assert.strictEqual(result.remainingBudgetFormatted, "₹500");
  assert.strictEqual(result.isOverBudget, false);
});

// ==============================================================================
// 4. Optimization Engine: Profiles & Deterministic Alternatives
// ==============================================================================

test("Optimization Engine: generates deterministic alternatives for over-budget trip", () => {
  const overBudgetSummary = budgetEngine.calculateFullTripBudget({
    totalBudget: 20000,
    isMinor: false,
    categoryCosts: {
      transport: toMinorUnits(8000),
      hotel: toMinorUnits(8000),
      food: toMinorUnits(4000),
      local_transport: toMinorUnits(2000),
      activities: toMinorUnits(3000),
      emergency_buffer: toMinorUnits(1000),
      shopping: toMinorUnits(0),
      other: toMinorUnits(0),
    },
  });

  assert.strictEqual(overBudgetSummary.isOverBudget, true);
  assert.strictEqual(overBudgetSummary.overBudgetMajor, 6000);

  const alternatives = generateDeterministicAlternatives(
    {
      destinationName: "Goa",
      durationDays: 4,
      travellerCount: 2,
      currency: "INR",
      budgetSummary: overBudgetSummary,
    },
    "Budget Saver"
  );

  assert.ok(alternatives.length >= 5, "Should generate multiple deterministic alternatives");

  const actionTypes = alternatives.map((a) => a.actionType);
  assert.ok(actionTypes.includes("cheaper_hotel"));
  assert.ok(actionTypes.includes("cheaper_transport"));
  assert.ok(actionTypes.includes("different_transport"));
  assert.ok(actionTypes.includes("cheaper_restaurant"));
  assert.ok(actionTypes.includes("remove_activity"));
  assert.ok(actionTypes.includes("replace_activity"));
  assert.ok(actionTypes.includes("optimize_route"));

  for (const alt of alternatives) {
    assert.ok(alt.possibleSavingsMinor > 0, "Every alternative must yield positive savings");
    assert.ok(alt.tradeOffs.length > 0, "Every alternative must state trade-offs");
    assert.strictEqual(alt.status, "pending");
  }
});

test("Optimization Engine: profiles alter alternative prioritization", () => {
  const summary = budgetEngine.calculateFullTripBudget({
    totalBudget: 20000,
    categoryCosts: {
      transport: toMinorUnits(7000),
      hotel: toMinorUnits(7000),
      food: toMinorUnits(3000),
      local_transport: toMinorUnits(2000),
      activities: toMinorUnits(3000),
      emergency_buffer: toMinorUnits(1000),
    },
  });

  const budgetSaverAlts = generateDeterministicAlternatives(
    { durationDays: 4, travellerCount: 2, currency: "INR", budgetSummary: summary },
    "Budget Saver"
  );

  const timeSaverAlts = generateDeterministicAlternatives(
    { durationDays: 4, travellerCount: 2, currency: "INR", budgetSummary: summary },
    "Time Saver"
  );

  const expMaxAlts = generateDeterministicAlternatives(
    { durationDays: 4, travellerCount: 2, currency: "INR", budgetSummary: summary },
    "Experience Maximizer"
  );

  // Time Saver prioritizes route optimization first
  assert.strictEqual(timeSaverAlts[0].actionType, "optimize_route");

  // Experience Maximizer excludes remove_activity
  const expActionTypes = expMaxAlts.map((a) => a.actionType);
  assert.strictEqual(expActionTypes.includes("remove_activity"), false);
});

// ==============================================================================
// 5. Accept / Reject Alternative Workflow
// ==============================================================================

test("Optimization Workflow: accepting alternatives reduces category cost and brings trip under budget", () => {
  const initialCosts: Record<BudgetCategory, number> = {
    transport: toMinorUnits(8000),
    hotel: toMinorUnits(8000),
    food: toMinorUnits(4000),
    local_transport: toMinorUnits(2000),
    activities: toMinorUnits(3000),
    shopping: toMinorUnits(0),
    emergency_buffer: toMinorUnits(1000),
    other: toMinorUnits(0),
  };

  const summary = budgetEngine.calculateFullTripBudget({
    totalBudget: 20000,
    categoryCosts: initialCosts,
  });

  assert.strictEqual(summary.isOverBudget, true); // Total = 26000, Over = 6000

  const alternatives = generateDeterministicAlternatives(
    { durationDays: 4, travellerCount: 2, currency: "INR", budgetSummary: summary },
    "Budget Saver"
  );

  const hotelAlt = alternatives.find((a) => a.actionType === "cheaper_hotel")!;
  const transportAlt = alternatives.find((a) => a.actionType === "cheaper_transport")!;

  // 1. Accept cheaper hotel
  const afterHotel = applyOptimizationAlternative(initialCosts, hotelAlt, "accept");
  assert.ok(afterHotel.appliedSavingsMinor > 0);
  assert.strictEqual(
    afterHotel.updatedCategoryCostsMinor.hotel,
    initialCosts.hotel - afterHotel.appliedSavingsMinor
  );

  // 2. Accept cheaper transport
  const afterBoth = applyOptimizationAlternative(
    afterHotel.updatedCategoryCostsMinor,
    transportAlt,
    "accept"
  );

  // 3. Recalculate full trip budget with accepted savings
  const newSummary = budgetEngine.calculateFullTripBudget({
    totalBudget: 20000,
    categoryCosts: afterBoth.updatedCategoryCostsMinor,
  });

  // Verify savings brought projected cost significantly down
  assert.ok(newSummary.totalCostMajor < summary.totalCostMajor);
  assert.ok(newSummary.totalCostMajor <= 20000, "Trip should now be within budget");
  assert.strictEqual(newSummary.isOverBudget, false);
});

test("Optimization Workflow: rejecting an alternative applies 0 savings", () => {
  const initialCosts: Record<BudgetCategory, number> = {
    transport: toMinorUnits(6000),
    hotel: toMinorUnits(6000),
    food: toMinorUnits(3000),
    local_transport: toMinorUnits(1500),
    activities: toMinorUnits(2000),
    shopping: toMinorUnits(0),
    emergency_buffer: toMinorUnits(1000),
    other: toMinorUnits(0),
  };

  const summary = budgetEngine.calculateFullTripBudget({
    totalBudget: 20000,
    categoryCosts: initialCosts,
  });

  const alternatives = generateDeterministicAlternatives(
    { durationDays: 4, travellerCount: 2, currency: "INR", budgetSummary: summary },
    "Balanced"
  );

  const alt = alternatives[0];
  const rejected = applyOptimizationAlternative(initialCosts, alt, "reject");

  assert.strictEqual(rejected.appliedSavingsMinor, 0);
  assert.strictEqual(
    rejected.updatedCategoryCostsMinor[alt.category],
    initialCosts[alt.category]
  );
});

// ==============================================================================
// 6. Service Layer & Expenses CRUD
// ==============================================================================

test("Budget Service: records and deletes actual expenses with precision", async () => {
  const userId = "test-user-budget-1";
  const tripRes = await createTrip(
    {
      origin: "New Delhi",
      destination: "Goa",
      start_date: "2026-11-01",
      end_date: "2026-11-05",
      budget: 20000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "moderate",
    },
    userId
  );

  assert.ok(tripRes.success && tripRes.data);
  const tripId = tripRes.data.id;

  // Add expense
  const expRes = await addTripExpense(tripId, userId, {
    category: "food",
    title: "Seafood dinner at Martin's Corner",
    amountMajor: 1250.5,
    currency: "INR",
    paymentMethod: "upi",
  });

  assert.ok(expRes.success && expRes.data);
  assert.strictEqual(expRes.data.amount_minor_units, 125050); // integer minor units
  assert.strictEqual(expRes.data.title, "Seafood dinner at Martin's Corner");

  // Fetch expenses
  const allExpenses = await getTripExpenses(tripId);
  assert.strictEqual(allExpenses.length, 1);
  assert.strictEqual(allExpenses[0].id, expRes.data.id);

  // Load trip budget details
  const budgetDetails = await getTripBudgetDetails(tripId, userId);
  assert.ok(budgetDetails.success && budgetDetails.data);
  assert.strictEqual(budgetDetails.data.totalExpensesMinor, 125050);
  assert.strictEqual(budgetDetails.data.totalExpensesMajor, 1250.5);

  // Delete expense
  const delRes = await deleteTripExpense(tripId, expRes.data.id, userId);
  assert.ok(delRes.success);

  const afterDelete = await getTripExpenses(tripId);
  assert.strictEqual(afterDelete.length, 0);
});
