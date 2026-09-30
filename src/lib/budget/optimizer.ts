import {
  OptimizationProfile,
  DeterministicAlternative,
  BudgetCategory,
  BudgetCalculationResult,
} from "@/types/budget";
import {
  toMinorUnits,
  fromMinorUnits,
  subtractMinor,
  formatCurrency,
} from "./money";

export interface OptimizerContext {
  destinationId?: string;
  destinationName?: string;
  durationDays: number;
  travellerCount: number;
  currency: string;
  budgetSummary: BudgetCalculationResult;
}

/**
 * Generates deterministic optimization alternatives based on current costs,
 * allocated budget, and selected optimization profile.
 */
export function generateDeterministicAlternatives(
  context: OptimizerContext,
  profile: OptimizationProfile = "Budget Saver"
): DeterministicAlternative[] {
  const { budgetSummary, durationDays, travellerCount, currency, destinationName = "Destination" } = context;
  const alternatives: DeterministicAlternative[] = [];

  const nights = Math.max(1, durationDays - 1);
  const travellers = Math.max(1, travellerCount);
  const rooms = Math.max(1, Math.ceil(travellers / 2));

  // Current category minor units
  const hotelMinor = budgetSummary.categories.hotel?.minorUnits ?? 0;
  const transportMinor = budgetSummary.categories.transport?.minorUnits ?? 0;
  const foodMinor = budgetSummary.categories.food?.minorUnits ?? 0;
  const localTransportMinor = budgetSummary.categories.local_transport?.minorUnits ?? 0;
  const activityMinor = budgetSummary.categories.activities?.minorUnits ?? 0;

  // 1. Cheaper Hotel Alternative
  if (hotelMinor > 0) {
    const currentNightlyRateMinor = Math.round(hotelMinor / (nights * rooms));
    // Propose a 30% - 45% cheaper certified stay depending on profile
    const discountFactor = profile === "Budget Saver" ? 0.45 : profile === "Balanced" ? 0.30 : 0.20;
    const proposedNightlyRateMinor = Math.round(currentNightlyRateMinor * (1 - discountFactor));
    const proposedTotalMinor = proposedNightlyRateMinor * nights * rooms;
    const savingsMinor = subtractMinor(hotelMinor, proposedTotalMinor);

    if (savingsMinor > 0) {
      alternatives.push({
        id: "alt-cheaper-hotel-1",
        category: "hotel",
        actionType: "cheaper_hotel",
        title: "Switch to Verified Heritage / Boutique Guesthouse",
        description: `Upgrade value by staying at a top-rated 3-star boutique lodge (${formatCurrency(proposedNightlyRateMinor, { isMinor: true, currency })}/night) instead of a luxury resort.`,
        currentCostMinor: hotelMinor,
        proposedCostMinor: proposedTotalMinor,
        possibleSavingsMinor: savingsMinor,
        currentCostMajor: fromMinorUnits(hotelMinor),
        proposedCostMajor: fromMinorUnits(proposedTotalMinor),
        possibleSavingsMajor: fromMinorUnits(savingsMinor),
        currentCostFormatted: formatCurrency(hotelMinor, { isMinor: true, currency }),
        proposedCostFormatted: formatCurrency(proposedTotalMinor, { isMinor: true, currency }),
        possibleSavingsFormatted: formatCurrency(savingsMinor, { isMinor: true, currency }),
        tradeOffs: "Located 1.5 km from the main beachfront/palace district with authentic local charm, but lacks an Olympic-size swimming pool.",
        status: "pending",
      });
    }
  }

  // 2. Cheaper Transport Alternative (e.g. Flight -> Premium Express Train or Early-Bird Fare)
  if (transportMinor > 0) {
    const currentPerPersonMinor = Math.round(transportMinor / travellers);
    const proposedPerPersonMinor = Math.round(currentPerPersonMinor * 0.55);
    const proposedTotalMinor = proposedPerPersonMinor * travellers;
    const savingsMinor = subtractMinor(transportMinor, proposedTotalMinor);

    if (savingsMinor > 0) {
      alternatives.push({
        id: "alt-cheaper-transport-1",
        category: "transport",
        actionType: "cheaper_transport",
        title: "Select Superfast Express Train (AC 3-Tier / Chair Car)",
        description: `Switch from peak-hour airline flight to comfortable Vande Bharat / Superfast Express train (${formatCurrency(proposedPerPersonMinor, { isMinor: true, currency })}/person).`,
        currentCostMinor: transportMinor,
        proposedCostMinor: proposedTotalMinor,
        possibleSavingsMinor: savingsMinor,
        currentCostMajor: fromMinorUnits(transportMinor),
        proposedCostMajor: fromMinorUnits(proposedTotalMinor),
        possibleSavingsMajor: fromMinorUnits(savingsMinor),
        currentCostFormatted: formatCurrency(transportMinor, { isMinor: true, currency }),
        proposedCostFormatted: formatCurrency(proposedTotalMinor, { isMinor: true, currency }),
        possibleSavingsFormatted: formatCurrency(savingsMinor, { isMinor: true, currency }),
        tradeOffs: "Travel time increases by ~3.5 hours, but provides scenic countryside views and drops you directly at city-center terminal.",
        status: "pending",
      });
    }
  }

  // 3. Different Transport Mode (e.g. Shared AC Transit / Scenic Sleeper Coach)
  if (transportMinor > 0) {
    const proposedPerPersonMinor = Math.round((transportMinor / travellers) * 0.40);
    const proposedTotalMinor = proposedPerPersonMinor * travellers;
    const savingsMinor = subtractMinor(transportMinor, proposedTotalMinor);

    if (savingsMinor > 0) {
      alternatives.push({
        id: "alt-diff-transport-1",
        category: "transport",
        actionType: "different_transport",
        title: "Overnight Premium AC Sleeper Bus",
        description: `Take a multi-axle AC Volvo sleeper coach (${formatCurrency(proposedPerPersonMinor, { isMinor: true, currency })}/person) arriving early morning.`,
        currentCostMinor: transportMinor,
        proposedCostMinor: proposedTotalMinor,
        possibleSavingsMinor: savingsMinor,
        currentCostMajor: fromMinorUnits(transportMinor),
        proposedCostMajor: fromMinorUnits(proposedTotalMinor),
        possibleSavingsMajor: fromMinorUnits(savingsMinor),
        currentCostFormatted: formatCurrency(transportMinor, { isMinor: true, currency }),
        proposedCostFormatted: formatCurrency(proposedTotalMinor, { isMinor: true, currency }),
        possibleSavingsFormatted: formatCurrency(savingsMinor, { isMinor: true, currency }),
        tradeOffs: "Highway travel overnight saves daytime exploration hours and eliminates one hotel night expense.",
        status: "pending",
      });
    }
  }

  // 4. Cheaper Restaurant / Dining Alternative
  if (foodMinor > 0) {
    const discountRate = profile === "Budget Saver" ? 0.35 : 0.25;
    const proposedTotalMinor = Math.round(foodMinor * (1 - discountRate));
    const savingsMinor = subtractMinor(foodMinor, proposedTotalMinor);

    if (savingsMinor > 0) {
      alternatives.push({
        id: "alt-cheaper-dining-1",
        category: "food",
        actionType: "cheaper_restaurant",
        title: "Embrace Celebrated Local Eateries & Thali Houses",
        description: `Rebalance dining plan from fine-dining bistros to highly rated iconic local eateries and authentic culinary heritage thalis.`,
        currentCostMinor: foodMinor,
        proposedCostMinor: proposedTotalMinor,
        possibleSavingsMinor: savingsMinor,
        currentCostMajor: fromMinorUnits(foodMinor),
        proposedCostMajor: fromMinorUnits(proposedTotalMinor),
        possibleSavingsMajor: fromMinorUnits(savingsMinor),
        currentCostFormatted: formatCurrency(foodMinor, { isMinor: true, currency }),
        proposedCostFormatted: formatCurrency(proposedTotalMinor, { isMinor: true, currency }),
        possibleSavingsFormatted: formatCurrency(savingsMinor, { isMinor: true, currency }),
        tradeOffs: "More bustling casual ambiance, but offers the truest regional culinary authenticity.",
        status: "pending",
      });
    }
  }

  // 5. Remove Low-Priority Activity
  if (activityMinor > 0) {
    // Propose dropping one lower-satisfaction or costly commercial activity (~25% of activities budget)
    const proposedTotalMinor = Math.round(activityMinor * 0.70);
    const savingsMinor = subtractMinor(activityMinor, proposedTotalMinor);

    if (savingsMinor > 0) {
      alternatives.push({
        id: "alt-remove-activity-1",
        category: "activities",
        actionType: "remove_activity",
        title: "Remove Commercial Waterpark / High-Fee Entry Attraction",
        description: `Eliminate expensive commercial recreation with high wait queues in ${destinationName} and reallocate time to self-guided exploration.`,
        currentCostMinor: activityMinor,
        proposedCostMinor: proposedTotalMinor,
        possibleSavingsMinor: savingsMinor,
        currentCostMajor: fromMinorUnits(activityMinor),
        proposedCostMajor: fromMinorUnits(proposedTotalMinor),
        possibleSavingsMajor: fromMinorUnits(savingsMinor),
        currentCostFormatted: formatCurrency(activityMinor, { isMinor: true, currency }),
        proposedCostFormatted: formatCurrency(proposedTotalMinor, { isMinor: true, currency }),
        possibleSavingsFormatted: formatCurrency(savingsMinor, { isMinor: true, currency }),
        tradeOffs: "Removes commercial amusement activity, giving you 3 unhurried hours for local exploration and relaxation.",
        status: "pending",
      });
    }
  }

  // 6. Replace Activity with Free / Low-Cost Cultural Sight
  if (activityMinor > 0) {
    const proposedTotalMinor = Math.round(activityMinor * 0.82);
    const savingsMinor = subtractMinor(activityMinor, proposedTotalMinor);

    if (savingsMinor > 0) {
      alternatives.push({
        id: "alt-replace-activity-1",
        category: "activities",
        actionType: "replace_activity",
        title: "Replace Private Boat Tour with Historic Fort & Sunset Point",
        description: `Substitute premium private tourist boat charter with iconic public sunset promenade, heritage walking tour, and scenic clifftop vantage.`,
        currentCostMinor: activityMinor,
        proposedCostMinor: proposedTotalMinor,
        possibleSavingsMinor: savingsMinor,
        currentCostMajor: fromMinorUnits(activityMinor),
        proposedCostMajor: fromMinorUnits(proposedTotalMinor),
        possibleSavingsMajor: fromMinorUnits(savingsMinor),
        currentCostFormatted: formatCurrency(activityMinor, { isMinor: true, currency }),
        proposedCostFormatted: formatCurrency(proposedTotalMinor, { isMinor: true, currency }),
        possibleSavingsFormatted: formatCurrency(savingsMinor, { isMinor: true, currency }),
        tradeOffs: "Slightly more walking required; offers equally breathtaking photography angles at zero admission fee.",
        status: "pending",
      });
    }
  }

  // 7. Optimize Local Route & Clustering
  if (localTransportMinor > 0) {
    const savingsPercentage = 0.35; // 35% savings from eliminating zig-zag taxi routes
    const proposedTotalMinor = Math.round(localTransportMinor * (1 - savingsPercentage));
    const savingsMinor = subtractMinor(localTransportMinor, proposedTotalMinor);

    if (savingsMinor > 0) {
      alternatives.push({
        id: "alt-optimize-route-1",
        category: "local_transport",
        actionType: "optimize_route",
        title: "Geographical Route Clustering & Metro Integration",
        description: `Reorder day itinerary visits into tight geographic clusters, eliminating cross-city backtracking and utilizing high-frequency rapid transit.`,
        currentCostMinor: localTransportMinor,
        proposedCostMinor: proposedTotalMinor,
        possibleSavingsMinor: savingsMinor,
        currentCostMajor: fromMinorUnits(localTransportMinor),
        proposedCostMajor: fromMinorUnits(proposedTotalMinor),
        possibleSavingsMajor: fromMinorUnits(savingsMinor),
        currentCostFormatted: formatCurrency(localTransportMinor, { isMinor: true, currency }),
        proposedCostFormatted: formatCurrency(proposedTotalMinor, { isMinor: true, currency }),
        possibleSavingsFormatted: formatCurrency(savingsMinor, { isMinor: true, currency }),
        tradeOffs: "Requires adhering to fixed sequence of neighborhood visits on each day.",
        status: "pending",
      });
    }
  }

  // Profile-specific sorting
  switch (profile) {
    case "Budget Saver":
      // Sort by absolute maximum savings descending
      return alternatives.sort(
        (a, b) => b.possibleSavingsMinor - a.possibleSavingsMinor
      );
    case "Time Saver":
      // Favor route optimization and transport alternatives
      return alternatives.sort((a, b) => {
        if (a.actionType === "optimize_route") return -1;
        if (b.actionType === "optimize_route") return 1;
        return b.possibleSavingsMinor - a.possibleSavingsMinor;
      });
    case "Experience Maximizer":
      // Keep activities high, favor lodging & transport savings
      return alternatives
        .filter((a) => a.actionType !== "remove_activity")
        .sort((a, b) => b.possibleSavingsMinor - a.possibleSavingsMinor);
    case "Balanced":
    default:
      return alternatives;
  }
}

/**
 * Applies or rejects an alternative, returning the recalculated category costs.
 */
export function applyOptimizationAlternative(
  currentCategoryCostsMinor: Record<BudgetCategory, number>,
  alternative: DeterministicAlternative,
  action: "accept" | "reject"
): {
  updatedCategoryCostsMinor: Record<BudgetCategory, number>;
  appliedSavingsMinor: number;
} {
  const updatedCosts = { ...currentCategoryCostsMinor };

  if (action === "reject") {
    return {
      updatedCategoryCostsMinor: updatedCosts,
      appliedSavingsMinor: 0,
    };
  }

  const category = alternative.category;
  const currentCost = updatedCosts[category] ?? alternative.currentCostMinor;
  const savings = alternative.possibleSavingsMinor;
  const newCost = Math.max(0, currentCost - savings);

  updatedCosts[category] = newCost;

  return {
    updatedCategoryCostsMinor: updatedCosts,
    appliedSavingsMinor: savings,
  };
}
