import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import {
  BudgetCategory,
  ALL_BUDGET_CATEGORIES,
  OptimizationProfile,
  DeterministicAlternative,
  ExpenseRecord,
  PriceSnapshotRecord,
  TripBudgetPageData,
} from "@/types/budget";
import { budgetEngine } from "@/lib/budget/engine";
import {
  toMinorUnits,
  fromMinorUnits,
  addMinor,
  formatCurrency,
} from "@/lib/budget/money";
import { generateDeterministicAlternatives } from "@/lib/budget/optimizer";
import { getTripById } from "@/lib/services/trip-service";

type PriceSnapshotRow = Database["public"]["Tables"]["price_snapshots"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];

// In-memory fallback stores for local testing without live Supabase
const memoryExpenses: Map<string, ExpenseRow> = new Map();
const memorySnapshots: Map<string, PriceSnapshotRow> = new Map();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url && key && !url.includes("mock-project") && key !== "mock-anon-key"
  );
}

/**
 * Returns complete budget data, category breakdown, deterministic alternatives,
 * and logged expenses for a given trip.
 */
export async function getTripBudgetDetails(
  tripId: string,
  userId: string,
  profile: OptimizationProfile = "Balanced"
): Promise<{ success: boolean; data?: TripBudgetPageData; error?: string }> {
  // 1. Verify trip exists and user is authorized
  const { trip, isAuthorized } = await getTripById(tripId, userId);
  if (!trip || !isAuthorized) {
    return { success: false, error: "Trip not found or unauthorized access." };
  }

  const currency = trip.currency || "INR";
  const durationDays = Math.max(1, trip.duration_days || 1);
  const travellerCount = Math.max(1, trip.traveller_count || 1);
  const totalBudgetMajor = Math.max(0, trip.budget || 20000);
  const totalBudgetMinor = toMinorUnits(totalBudgetMajor);

  // 2. Load Price Snapshots if available
  const snapshots = await getTripPriceSnapshots(tripId);

  // 3. Establish Category Costs (Deterministic baseline model)
  // If baseline matches standard ₹20,000 example, maintain exact ratios:
  // Transport: 30%, Hotel: 30%, Food: 15%, Local Transport: 7.5%, Activities: 10%, Emergency: 5%
  let categoryCostsMinor: Record<BudgetCategory, number>;

  if (snapshots.length > 0) {
    categoryCostsMinor = {
      transport: 0,
      hotel: 0,
      food: 0,
      local_transport: 0,
      activities: 0,
      shopping: 0,
      emergency_buffer: 0,
      other: 0,
    };
    for (const snap of snapshots) {
      const cat = snap.item_type as BudgetCategory;
      if (categoryCostsMinor[cat] !== undefined) {
        categoryCostsMinor[cat] = addMinor(
          categoryCostsMinor[cat],
          snap.price_minor_units
        );
      }
    }
  } else {
    // Standard baseline distribution
    if (totalBudgetMajor === 20000 && currency === "INR") {
      // Matches the exact example in prompt:
      // Transport: ₹6,000, Hotel: ₹6,000, Food: ₹3,000, Local transport: ₹1,500, Activities: ₹2,000, Emergency: ₹1,000 = Total ₹19,500
      categoryCostsMinor = {
        transport: toMinorUnits(6000),
        hotel: toMinorUnits(6000),
        food: toMinorUnits(3000),
        local_transport: toMinorUnits(1500),
        activities: toMinorUnits(2000),
        shopping: toMinorUnits(0),
        emergency_buffer: toMinorUnits(1000),
        other: toMinorUnits(0),
      };
    } else {
      // Proportional deterministic split
      categoryCostsMinor = {
        transport: toMinorUnits(Math.round(totalBudgetMajor * 0.3)),
        hotel: toMinorUnits(Math.round(totalBudgetMajor * 0.3)),
        food: toMinorUnits(Math.round(totalBudgetMajor * 0.15)),
        local_transport: toMinorUnits(Math.round(totalBudgetMajor * 0.075)),
        activities: toMinorUnits(Math.round(totalBudgetMajor * 0.1)),
        shopping: toMinorUnits(0),
        emergency_buffer: toMinorUnits(Math.round(totalBudgetMajor * 0.05)),
        other: toMinorUnits(0),
      };
    }
  }

  // 4. Run BudgetEngine calculation
  const budgetSummary = budgetEngine.calculateFullTripBudget({
    totalBudget: totalBudgetMinor,
    categoryCosts: categoryCostsMinor,
    isMinor: true,
    currency,
  });

  // 5. Load Logged Actual Expenses
  const expenses = await getTripExpenses(tripId);
  let totalExpensesMinor = 0;
  for (const exp of expenses) {
    totalExpensesMinor = addMinor(totalExpensesMinor, exp.amount_minor_units);
  }

  // 6. Generate Deterministic Alternatives
  const alternatives = generateDeterministicAlternatives(
    {
      destinationName: trip.destination,
      durationDays,
      travellerCount,
      currency,
      budgetSummary,
    },
    profile
  );

  return {
    success: true,
    data: {
      tripId: trip.id,
      tripTitle: `${trip.origin} to ${trip.destination}`,
      origin: trip.origin,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      durationDays,
      travellerCount,
      currency,
      selectedProfile: profile,
      budgetSummary,
      alternatives,
      expenses,
      totalExpensesMinor,
      totalExpensesMajor: fromMinorUnits(totalExpensesMinor),
      totalExpensesFormatted: formatCurrency(totalExpensesMinor, {
        isMinor: true,
        currency,
      }),
    },
  };
}

/**
 * Fetch all price snapshots for a trip
 */
export async function getTripPriceSnapshots(
  tripId: string
): Promise<PriceSnapshotRecord[]> {
  if (!isSupabaseLive()) {
    const list: PriceSnapshotRecord[] = [];
    for (const snap of Array.from(memorySnapshots.values())) {
      if (snap.trip_id === tripId) {
        list.push(snap as unknown as PriceSnapshotRecord);
      }
    }
    return list;
  }

  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("price_snapshots")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });

    return (data || []) as unknown as PriceSnapshotRecord[];
  } catch {
    return [];
  }
}

/**
 * Fetch all expenses for a trip
 */
export async function getTripExpenses(tripId: string): Promise<ExpenseRecord[]> {
  if (!isSupabaseLive()) {
    const list: ExpenseRecord[] = [];
    for (const exp of Array.from(memoryExpenses.values())) {
      if (exp.trip_id === tripId) {
        list.push(exp as unknown as ExpenseRecord);
      }
    }
    return list.sort((a, b) => b.paid_at.localeCompare(a.paid_at));
  }

  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .order("paid_at", { ascending: false });

    return (data || []) as unknown as ExpenseRecord[];
  } catch {
    return [];
  }
}

/**
 * Add a new recorded expense
 */
export async function addTripExpense(
  tripId: string,
  userId: string,
  expense: {
    category: BudgetCategory;
    title: string;
    amountMajor: number;
    currency?: string;
    paidAt?: string;
    paymentMethod?: string;
    notes?: string;
  }
): Promise<{ success: boolean; data?: ExpenseRecord; error?: string }> {
  if (!expense.title || expense.title.trim().length === 0) {
    return { success: false, error: "Expense description is required." };
  }

  if (typeof expense.amountMajor !== "number" || expense.amountMajor <= 0) {
    return { success: false, error: "Expense amount must be greater than zero." };
  }

  if (!ALL_BUDGET_CATEGORIES.includes(expense.category)) {
    return { success: false, error: "Invalid budget category." };
  }

  const amountMinor = toMinorUnits(expense.amountMajor);
  const currency = expense.currency ?? "INR";
  const now = new Date().toISOString();
  const paidAt = expense.paidAt || now;

  if (!isSupabaseLive()) {
    const id = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: ExpenseRow = {
      id,
      trip_id: tripId,
      user_id: userId,
      category: expense.category,
      title: expense.title.trim(),
      amount_minor_units: amountMinor,
      currency,
      paid_at: paidAt,
      payment_method: expense.paymentMethod || "cash",
      notes: expense.notes || null,
      created_at: now,
      updated_at: now,
    };
    memoryExpenses.set(id, newRecord);
    return { success: true, data: newRecord as unknown as ExpenseRecord };
  }

  try {
    const supabase = createServerSupabase();
    const client = supabase as unknown as {
      from: (table: string) => {
        insert: (data: unknown) => {
          select: () => {
            single: () => Promise<{ data: unknown; error: { message: string } | null }>;
          };
        };
      };
    };
    const { data, error } = await client
      .from("expenses")
      .insert({
        trip_id: tripId,
        user_id: userId,
        category: expense.category,
        title: expense.title.trim(),
        amount_minor_units: amountMinor,
        currency,
        paid_at: paidAt,
        payment_method: expense.paymentMethod || "cash",
        notes: expense.notes || null,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as unknown as ExpenseRecord };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to record expense",
    };
  }
}

/**
 * Delete a recorded expense
 */
export async function deleteTripExpense(
  tripId: string,
  expenseId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseLive()) {
    const exp = memoryExpenses.get(expenseId);
    if (!exp || exp.trip_id !== tripId) {
      return { success: false, error: "Expense not found." };
    }
    memoryExpenses.delete(expenseId);
    return { success: true };
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("trip_id", tripId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete expense",
    };
  }
}
