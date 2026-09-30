import {
  BudgetCategory,
  ALL_BUDGET_CATEGORIES,
  CategoryBreakdown,
  BudgetCalculationResult,
} from "@/types/budget";
import {
  toMinorUnits,
  fromMinorUnits,
  addMinor,
  subtractMinor,
  multiplyMinor,
  percentageMinor,
  formatCurrency,
} from "./money";

// ==============================================================================
// Input Types for BudgetEngine Functions
// ==============================================================================

export interface TransportCostInput {
  pricePerPerson?: number;
  travellerCount?: number;
  isMinor?: boolean;
  currency?: string;
  items?: Array<{
    name?: string;
    price: number;
    isMinor?: boolean;
    quantity?: number;
  }>;
  fixedTotalMinor?: number;
}

export interface HotelCostInput {
  pricePerNight?: number;
  nights?: number;
  roomCount?: number;
  travellerCount?: number;
  isMinor?: boolean;
  currency?: string;
  items?: Array<{
    name?: string;
    pricePerNight: number;
    nights: number;
    roomCount?: number;
    isMinor?: boolean;
  }>;
  fixedTotalMinor?: number;
}

export interface FoodCostInput {
  dailyCostPerPerson?: number;
  travellerCount?: number;
  durationDays?: number;
  isMinor?: boolean;
  currency?: string;
  fixedTotalMinor?: number;
}

export interface LocalTransportCostInput {
  dailyCost?: number;
  durationDays?: number;
  travellerCount?: number;
  isMinor?: boolean;
  currency?: string;
  fixedTotalMinor?: number;
}

export interface ActivityCostInput {
  activities?: Array<{
    name?: string;
    ticketPrice: number;
    travellerCount?: number;
    isMinor?: boolean;
  }>;
  travellerCount?: number;
  currency?: string;
  fixedTotalMinor?: number;
}

export interface EmergencyBufferInput {
  subtotalMinor?: number;
  totalBudgetMinor?: number;
  percentage?: number; // e.g. 5 for 5%
  fixedTotalMinor?: number;
  currency?: string;
}

export type CategoryCostMap = Partial<
  Record<BudgetCategory, number | { minorUnits: number; itemCount?: number }>
>;

// ==============================================================================
// Deterministic Budget Engine
// Strictly uses integer minor units to guarantee zero floating-point drift.
// ==============================================================================

export class BudgetEngine {
  private currency: string;

  constructor(currency: string = "INR") {
    this.currency = currency;
  }

  /**
   * 1. calculateTransportCost
   * Computes transport expense for all travelers using minor units.
   */
  calculateTransportCost(input: TransportCostInput): {
    minorUnits: number;
    majorUnits: number;
    formatted: string;
    itemCount: number;
  } {
    let totalMinor = 0;
    let itemCount = 0;

    if (input.fixedTotalMinor !== undefined) {
      totalMinor = Math.round(input.fixedTotalMinor);
      itemCount = 1;
    } else if (input.items && input.items.length > 0) {
      for (const item of input.items) {
        const itemPriceMinor = item.isMinor
          ? Math.round(item.price)
          : toMinorUnits(item.price);
        const qty = item.quantity ?? 1;
        totalMinor = addMinor(totalMinor, multiplyMinor(itemPriceMinor, qty));
        itemCount += qty;
      }
    } else if (input.pricePerPerson !== undefined) {
      const priceMinor = input.isMinor
        ? Math.round(input.pricePerPerson)
        : toMinorUnits(input.pricePerPerson);
      const count = Math.max(1, input.travellerCount ?? 1);
      totalMinor = multiplyMinor(priceMinor, count);
      itemCount = count;
    }

    const majorUnits = fromMinorUnits(totalMinor);
    return {
      minorUnits: totalMinor,
      majorUnits,
      formatted: formatCurrency(totalMinor, {
        isMinor: true,
        currency: input.currency ?? this.currency,
      }),
      itemCount,
    };
  }

  /**
   * 2. calculateHotelCost
   * Computes hotel lodging cost based on nights and rooms.
   */
  calculateHotelCost(input: HotelCostInput): {
    minorUnits: number;
    majorUnits: number;
    formatted: string;
    nights: number;
    roomCount: number;
  } {
    let totalMinor = 0;
    let nightsTotal = 0;
    let roomsTotal = 0;

    if (input.fixedTotalMinor !== undefined) {
      totalMinor = Math.round(input.fixedTotalMinor);
      nightsTotal = input.nights ?? 1;
      roomsTotal = input.roomCount ?? 1;
    } else if (input.items && input.items.length > 0) {
      for (const item of input.items) {
        const priceMinor = item.isMinor
          ? Math.round(item.pricePerNight)
          : toMinorUnits(item.pricePerNight);
        const rooms = Math.max(1, item.roomCount ?? 1);
        const n = Math.max(1, item.nights);
        const itemTotal = multiplyMinor(priceMinor, rooms * n);
        totalMinor = addMinor(totalMinor, itemTotal);
        nightsTotal += n;
        roomsTotal += rooms;
      }
    } else if (input.pricePerNight !== undefined) {
      const priceMinor = input.isMinor
        ? Math.round(input.pricePerNight)
        : toMinorUnits(input.pricePerNight);
      nightsTotal = Math.max(1, input.nights ?? 1);
      roomsTotal =
        input.roomCount ??
        Math.max(1, Math.ceil((input.travellerCount ?? 1) / 2));
      totalMinor = multiplyMinor(priceMinor, nightsTotal * roomsTotal);
    }

    const majorUnits = fromMinorUnits(totalMinor);
    return {
      minorUnits: totalMinor,
      majorUnits,
      formatted: formatCurrency(totalMinor, {
        isMinor: true,
        currency: input.currency ?? this.currency,
      }),
      nights: nightsTotal,
      roomCount: roomsTotal,
    };
  }

  /**
   * 3. calculateFoodCost
   * Computes food expenditure over trip duration.
   */
  calculateFoodCost(input: FoodCostInput): {
    minorUnits: number;
    majorUnits: number;
    formatted: string;
  } {
    let totalMinor = 0;

    if (input.fixedTotalMinor !== undefined) {
      totalMinor = Math.round(input.fixedTotalMinor);
    } else if (input.dailyCostPerPerson !== undefined) {
      const dailyMinor = input.isMinor
        ? Math.round(input.dailyCostPerPerson)
        : toMinorUnits(input.dailyCostPerPerson);
      const days = Math.max(1, input.durationDays ?? 1);
      const travellers = Math.max(1, input.travellerCount ?? 1);
      totalMinor = multiplyMinor(dailyMinor, days * travellers);
    }

    const majorUnits = fromMinorUnits(totalMinor);
    return {
      minorUnits: totalMinor,
      majorUnits,
      formatted: formatCurrency(totalMinor, {
        isMinor: true,
        currency: input.currency ?? this.currency,
      }),
    };
  }

  /**
   * 4. calculateLocalTransportCost
   * Computes local transit (cabs, rickshaws, metro) across trip days.
   */
  calculateLocalTransportCost(input: LocalTransportCostInput): {
    minorUnits: number;
    majorUnits: number;
    formatted: string;
  } {
    let totalMinor = 0;

    if (input.fixedTotalMinor !== undefined) {
      totalMinor = Math.round(input.fixedTotalMinor);
    } else if (input.dailyCost !== undefined) {
      const dailyMinor = input.isMinor
        ? Math.round(input.dailyCost)
        : toMinorUnits(input.dailyCost);
      const days = Math.max(1, input.durationDays ?? 1);
      totalMinor = multiplyMinor(dailyMinor, days);
    }

    const majorUnits = fromMinorUnits(totalMinor);
    return {
      minorUnits: totalMinor,
      majorUnits,
      formatted: formatCurrency(totalMinor, {
        isMinor: true,
        currency: input.currency ?? this.currency,
      }),
    };
  }

  /**
   * 5. calculateActivityCost
   * Computes tickets & guided activity fees for all travelers.
   */
  calculateActivityCost(input: ActivityCostInput): {
    minorUnits: number;
    majorUnits: number;
    formatted: string;
    activityCount: number;
  } {
    let totalMinor = 0;
    let activityCount = 0;

    if (input.fixedTotalMinor !== undefined) {
      totalMinor = Math.round(input.fixedTotalMinor);
      activityCount = 1;
    } else if (input.activities && input.activities.length > 0) {
      const defaultTravellers = Math.max(1, input.travellerCount ?? 1);
      for (const act of input.activities) {
        const ticketMinor = act.isMinor
          ? Math.round(act.ticketPrice)
          : toMinorUnits(act.ticketPrice);
        const travellers = Math.max(1, act.travellerCount ?? defaultTravellers);
        totalMinor = addMinor(totalMinor, multiplyMinor(ticketMinor, travellers));
        activityCount += 1;
      }
    }

    const majorUnits = fromMinorUnits(totalMinor);
    return {
      minorUnits: totalMinor,
      majorUnits,
      formatted: formatCurrency(totalMinor, {
        isMinor: true,
        currency: input.currency ?? this.currency,
      }),
      activityCount,
    };
  }

  /**
   * 6. calculateEmergencyBuffer
   * Computes emergency reserve buffer (e.g. 5% of subtotal or budget).
   */
  calculateEmergencyBuffer(input: EmergencyBufferInput): {
    minorUnits: number;
    majorUnits: number;
    formatted: string;
    percentage: number;
  } {
    const percentage = input.percentage ?? 5; // Default 5%
    let totalMinor = 0;

    if (input.fixedTotalMinor !== undefined) {
      totalMinor = Math.round(input.fixedTotalMinor);
    } else if (input.totalBudgetMinor !== undefined) {
      totalMinor = percentageMinor(Math.round(input.totalBudgetMinor), percentage);
    } else if (input.subtotalMinor !== undefined) {
      totalMinor = percentageMinor(Math.round(input.subtotalMinor), percentage);
    }

    const majorUnits = fromMinorUnits(totalMinor);
    return {
      minorUnits: totalMinor,
      majorUnits,
      formatted: formatCurrency(totalMinor, {
        isMinor: true,
        currency: input.currency ?? this.currency,
      }),
      percentage,
    };
  }

  /**
   * 7. calculateTripCost
   * Aggregates all 8 budget categories into an overall total cost.
   */
  calculateTripCost(
    categoryCosts: CategoryCostMap,
    options: { currency?: string; isMinor?: boolean } = {}
  ): {
    totalMinor: number;
    totalMajor: number;
    formatted: string;
    categories: Record<BudgetCategory, CategoryBreakdown>;
  } {
    const isMinor = options.isMinor ?? true;
    const currency = options.currency ?? this.currency;

    let grandTotalMinor = 0;
    const resolvedCategories: Partial<Record<BudgetCategory, CategoryBreakdown>> = {};

    for (const cat of ALL_BUDGET_CATEGORIES) {
      const val = categoryCosts[cat];
      let minor = 0;
      let count = 0;

      if (typeof val === "number") {
        minor = isMinor ? Math.round(val) : toMinorUnits(val);
        count = minor > 0 ? 1 : 0;
      } else if (val && typeof val === "object") {
        minor = Math.round(val.minorUnits);
        count = val.itemCount ?? (minor > 0 ? 1 : 0);
      }

      grandTotalMinor = addMinor(grandTotalMinor, minor);

      const major = fromMinorUnits(minor);
      resolvedCategories[cat] = {
        category: cat,
        name: this.formatCategoryName(cat),
        minorUnits: minor,
        majorUnits: major,
        formatted: formatCurrency(minor, { isMinor: true, currency }),
        itemCount: count,
        percentageOfTotal: 0, // Computed below once grandTotal is known
      };
    }

    // Populate percentage of total for each category
    for (const cat of ALL_BUDGET_CATEGORIES) {
      const item = resolvedCategories[cat]!;
      if (grandTotalMinor > 0) {
        item.percentageOfTotal =
          Math.round((item.minorUnits / grandTotalMinor) * 1000) / 10;
      } else {
        item.percentageOfTotal = 0;
      }
    }

    const totalMajor = fromMinorUnits(grandTotalMinor);
    return {
      totalMinor: grandTotalMinor,
      totalMajor,
      formatted: formatCurrency(grandTotalMinor, { isMinor: true, currency }),
      categories: resolvedCategories as Record<BudgetCategory, CategoryBreakdown>,
    };
  }

  /**
   * 8. calculateRemainingBudget
   * Computes difference between total allocated budget and projected trip cost.
   */
  calculateRemainingBudget(
    totalBudgetMinor: number,
    tripCostMinor: number,
    options: { currency?: string } = {}
  ): {
    remainingMinor: number;
    remainingMajor: number;
    formatted: string;
    isPositive: boolean;
  } {
    const diff = subtractMinor(Math.round(totalBudgetMinor), Math.round(tripCostMinor));
    const remainingMajor = fromMinorUnits(diff);
    const currency = options.currency ?? this.currency;

    return {
      remainingMinor: diff,
      remainingMajor,
      formatted: formatCurrency(diff, { isMinor: true, currency }),
      isPositive: diff >= 0,
    };
  }

  /**
   * 9. calculateOverBudget
   * Identifies over-budget state, excess amount, and percentage over.
   */
  calculateOverBudget(
    totalBudgetMinor: number,
    tripCostMinor: number,
    options: { currency?: string } = {}
  ): {
    isOverBudget: boolean;
    overBudgetMinor: number;
    overBudgetMajor: number;
    formatted: string;
    percentageOver: number;
  } {
    const budget = Math.round(totalBudgetMinor);
    const cost = Math.round(tripCostMinor);
    const excess = cost - budget;
    const isOver = excess > 0;
    const overMinor = isOver ? excess : 0;
    const overMajor = fromMinorUnits(overMinor);
    const currency = options.currency ?? this.currency;

    const percentageOver =
      isOver && budget > 0
        ? Math.round((overMinor / budget) * 1000) / 10
        : 0;

    return {
      isOverBudget: isOver,
      overBudgetMinor: overMinor,
      overBudgetMajor: overMajor,
      formatted: formatCurrency(overMinor, { isMinor: true, currency }),
      percentageOver,
    };
  }

  /**
   * High-Level Comprehensive Trip Budget Synthesizer
   */
  calculateFullTripBudget(params: {
    totalBudget: number; // In major units (e.g. 20000)
    categoryCosts?: CategoryCostMap;
    isMinor?: boolean;
    currency?: string;
  }): BudgetCalculationResult {
    const currency = params.currency ?? this.currency;
    const budgetMinor = params.isMinor
      ? Math.round(params.totalBudget)
      : toMinorUnits(params.totalBudget);

    const tripCost = this.calculateTripCost(params.categoryCosts ?? {}, {
      currency,
      isMinor: true,
    });

    const remaining = this.calculateRemainingBudget(
      budgetMinor,
      tripCost.totalMinor,
      { currency }
    );

    const overBudget = this.calculateOverBudget(
      budgetMinor,
      tripCost.totalMinor,
      { currency }
    );

    return {
      budgetMinor,
      budgetMajor: fromMinorUnits(budgetMinor),
      budgetFormatted: formatCurrency(budgetMinor, { isMinor: true, currency }),

      totalCostMinor: tripCost.totalMinor,
      totalCostMajor: tripCost.totalMajor,
      totalCostFormatted: tripCost.formatted,

      remainingBudgetMinor: remaining.remainingMinor,
      remainingBudgetMajor: remaining.remainingMajor,
      remainingBudgetFormatted: remaining.formatted,

      isOverBudget: overBudget.isOverBudget,
      overBudgetMinor: overBudget.overBudgetMinor,
      overBudgetMajor: overBudget.overBudgetMajor,
      overBudgetFormatted: overBudget.formatted,
      percentageOverBudget: overBudget.percentageOver,

      categories: tripCost.categories,
      currency,
    };
  }

  private formatCategoryName(category: BudgetCategory): string {
    switch (category) {
      case "transport":
        return "Transport";
      case "hotel":
        return "Accommodation";
      case "food":
        return "Food & Dining";
      case "local_transport":
        return "Local Transport";
      case "activities":
        return "Activities & Sightseeing";
      case "shopping":
        return "Shopping";
      case "emergency_buffer":
        return "Emergency Buffer";
      case "other":
        return "Other Expenses";
      default:
        return category;
    }
  }
}

// Default singleton instance
export const budgetEngine = new BudgetEngine();
