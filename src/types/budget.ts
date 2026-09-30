// ==============================================================================
// Phase 4: Deterministic Travel Budget & Optimization Types
// ==============================================================================

export type BudgetCategory =
  | "transport"
  | "hotel"
  | "food"
  | "local_transport"
  | "activities"
  | "shopping"
  | "emergency_buffer"
  | "other";

export const ALL_BUDGET_CATEGORIES: BudgetCategory[] = [
  "transport",
  "hotel",
  "food",
  "local_transport",
  "activities",
  "shopping",
  "emergency_buffer",
  "other",
];

export type OptimizationProfile =
  | "Budget Saver"
  | "Time Saver"
  | "Experience Maximizer"
  | "Balanced";

export interface CategoryBreakdown {
  category: BudgetCategory;
  name: string;
  minorUnits: number; // Integer minor units (e.g. paise / cents)
  majorUnits: number; // Formatted major units (e.g. Rupees)
  formatted: string;  // e.g. "₹6,000"
  itemCount: number;
  percentageOfTotal: number;
}

export interface BudgetCalculationResult {
  budgetMinor: number;
  budgetMajor: number;
  budgetFormatted: string;

  totalCostMinor: number;
  totalCostMajor: number;
  totalCostFormatted: string;

  remainingBudgetMinor: number;
  remainingBudgetMajor: number;
  remainingBudgetFormatted: string;

  isOverBudget: boolean;
  overBudgetMinor: number;
  overBudgetMajor: number;
  overBudgetFormatted: string;
  percentageOverBudget: number;

  categories: Record<BudgetCategory, CategoryBreakdown>;
  currency: string;
}

export type AlternativeActionType =
  | "cheaper_hotel"
  | "cheaper_transport"
  | "different_transport"
  | "cheaper_restaurant"
  | "remove_activity"
  | "replace_activity"
  | "optimize_route";

export interface DeterministicAlternative {
  id: string;
  category: BudgetCategory;
  actionType: AlternativeActionType;
  title: string;
  description: string;
  currentCostMinor: number;
  proposedCostMinor: number;
  possibleSavingsMinor: number;

  currentCostMajor: number;
  proposedCostMajor: number;
  possibleSavingsMajor: number;

  currentCostFormatted: string;
  proposedCostFormatted: string;
  possibleSavingsFormatted: string;

  tradeOffs: string;
  status: "pending" | "accepted" | "rejected";

  originalItemId?: string;
  replacementItemId?: string;
  replacementItemName?: string;
}

export interface ExpenseRecord {
  id: string;
  trip_id: string;
  user_id?: string | null;
  category: BudgetCategory;
  title: string;
  amount_minor_units: number;
  currency: string;
  paid_at: string;
  payment_method?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface PriceSnapshotRecord {
  id: string;
  trip_id: string;
  item_type: "hotel" | "attraction" | "transport" | "restaurant" | "local_transport";
  item_id: string;
  item_name: string;
  price_minor_units: number;
  currency: string;
  snapshot_date: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface TripBudgetPageData {
  tripId: string;
  tripTitle: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travellerCount: number;
  currency: string;
  selectedProfile: OptimizationProfile;
  budgetSummary: BudgetCalculationResult;
  alternatives: DeterministicAlternative[];
  expenses: ExpenseRecord[];
  totalExpensesMinor: number;
  totalExpensesMajor: number;
  totalExpensesFormatted: string;
}
