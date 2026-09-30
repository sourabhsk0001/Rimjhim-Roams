// ==============================================================================
// Phase 12: Collaborative Expense Splitting & Settlement Service
// ==============================================================================

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  CreateSplitExpenseInput,
  TripSplitExpense,
  ExpenseParticipant,
  SettlementResult,
} from "@/types/collaboration";
import { settlementEngine } from "@/lib/engines/settlement-engine";
import { collaborationService } from "./collaboration-service";
import { formatCurrency } from "@/lib/budget/money";

// In-memory fallback stores
export const memoryExpenses: Map<string, TripSplitExpense> =
  (globalThis as unknown as { __memoryExpenses?: Map<string, TripSplitExpense> }).__memoryExpenses ||
  new Map<string, TripSplitExpense>();
(globalThis as unknown as { __memoryExpenses?: Map<string, TripSplitExpense> }).__memoryExpenses = memoryExpenses;

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

export class ExpenseSplittingService {
  /**
   * Creates an expense with automatic participant share calculation (Equal, Custom, Percentage).
   */
  async createSplitExpense(
    input: CreateSplitExpenseInput,
    callerUserId: string
  ): Promise<{ success: boolean; expense?: TripSplitExpense; error?: string }> {
    const role = await collaborationService.getUserTripRole(input.trip_id, callerUserId);
    if (!role || (role !== "owner" && role !== "editor")) {
      return { success: false, error: "Only trip owners or editors can add shared expenses." };
    }

    if (!input.title || input.title.trim().length === 0) {
      return { success: false, error: "Expense title is required." };
    }

    if (input.amount_minor_units <= 0) {
      return { success: false, error: "Expense amount must be greater than zero." };
    }

    if (!input.participants || input.participants.length === 0) {
      return { success: false, error: "At least one participant must be included in the split." };
    }

    // 1. Deterministically calculate individual shares
    let calculatedShares: Array<{
      user_id: string;
      share_amount_minor_units: number;
      share_percentage?: number | null;
    }>;

    try {
      calculatedShares = settlementEngine.calculateParticipantShares(
        input.amount_minor_units,
        input.split_type,
        input.participants
      );
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to calculate split shares.",
      };
    }

    const expenseId = `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const currency = input.currency || "INR";
    const now = new Date().toISOString();
    const paidAt = input.paid_at || now;

    const participants: ExpenseParticipant[] = calculatedShares.map((s, idx) => ({
      id: `part-${expenseId}-${idx}`,
      expense_id: expenseId,
      trip_id: input.trip_id,
      user_id: s.user_id,
      share_amount_minor_units: s.share_amount_minor_units,
      share_percentage: s.share_percentage ?? null,
      has_settled: false,
      created_at: now,
    }));

    if (!isSupabaseLive()) {
      const expense: TripSplitExpense = {
        id: expenseId,
        trip_id: input.trip_id,
        paid_by: input.paid_by,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        category: input.category || "other",
        amount_minor_units: input.amount_minor_units,
        amount_formatted: formatCurrency(input.amount_minor_units, { currency, isMinor: true }),
        currency,
        split_type: input.split_type,
        paid_at: paidAt,
        participants,
        created_at: now,
      };

      memoryExpenses.set(expenseId, expense);
      return { success: true, expense };
    }

    try {
      const supabase = createServerSupabase() as any;

      // Insert into expenses
      const { data: expData, error: expErr } = await supabase
        .from("expenses")
        .insert({
          trip_id: input.trip_id,
          user_id: input.paid_by,
          paid_by: input.paid_by,
          title: input.title.trim(),
          category: input.category as any,
          amount_minor_units: input.amount_minor_units,
          currency,
          split_type: input.split_type,
          paid_at: paidAt,
          notes: input.description?.trim() || null,
        })
        .select()
        .single();

      if (expErr || !expData) {
        return { success: false, error: expErr?.message || "Failed to create expense." };
      }

      // Insert participants
      const participantRows = calculatedShares.map((s) => ({
        expense_id: expData.id,
        trip_id: input.trip_id,
        user_id: s.user_id,
        share_amount_minor_units: s.share_amount_minor_units,
        share_percentage: s.share_percentage ?? null,
        has_settled: false,
      }));

      const { data: partData, error: partErr } = await supabase
        .from("expense_participants")
        .insert(participantRows)
        .select();

      if (partErr) {
        return { success: false, error: partErr.message };
      }

      const formattedParticipants: ExpenseParticipant[] = (partData || []).map((p: any) => ({
        id: p.id,
        expense_id: p.expense_id,
        trip_id: p.trip_id,
        user_id: p.user_id,
        share_amount_minor_units: Number(p.share_amount_minor_units),
        share_percentage: p.share_percentage ? Number(p.share_percentage) : null,
        has_settled: p.has_settled,
        created_at: p.created_at,
      }));

      return {
        success: true,
        expense: {
          id: expData.id,
          trip_id: expData.trip_id,
          paid_by: expData.paid_by || expData.user_id || input.paid_by,
          title: expData.title,
          description: expData.notes,
          category: expData.category,
          amount_minor_units: Number(expData.amount_minor_units),
          amount_formatted: formatCurrency(Number(expData.amount_minor_units), { currency, isMinor: true }),
          currency: expData.currency,
          split_type: (expData.split_type as any) || "equal",
          paid_at: expData.paid_at,
          participants: formattedParticipants,
          created_at: expData.created_at,
        },
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Database error adding expense.",
      };
    }
  }

  /**
   * Retrieves all shared expenses with participant breakdowns for a trip.
   */
  async getTripExpenses(
    tripId: string,
    callerUserId: string
  ): Promise<{ success: boolean; expenses: TripSplitExpense[]; error?: string }> {
    const isMember = await collaborationService.isUserTripMember(tripId, callerUserId);
    if (!isMember) {
      return { success: false, expenses: [], error: "Unauthorized." };
    }

    if (!isSupabaseLive()) {
      const list = Array.from(memoryExpenses.values())
        .filter((e) => e.trip_id === tripId)
        .sort((a, b) => b.paid_at.localeCompare(a.paid_at));
      return { success: true, expenses: list };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { data: expData, error: expErr } = await supabase
        .from("expenses")
        .select(`
          id,
          trip_id,
          paid_by,
          user_id,
          title,
          notes,
          category,
          amount_minor_units,
          currency,
          split_type,
          paid_at,
          created_at,
          expense_participants (
            id,
            expense_id,
            trip_id,
            user_id,
            share_amount_minor_units,
            share_percentage,
            has_settled,
            created_at
          )
        `)
        .eq("trip_id", tripId)
        .order("paid_at", { ascending: false });

      if (expErr) return { success: false, expenses: [], error: expErr.message };

      const expenses: TripSplitExpense[] = (expData || []).map((e: any) => {
        const parts: ExpenseParticipant[] = (e.expense_participants || []).map((p: any) => ({
          id: p.id,
          expense_id: p.expense_id,
          trip_id: p.trip_id,
          user_id: p.user_id,
          share_amount_minor_units: Number(p.share_amount_minor_units),
          share_percentage: p.share_percentage ? Number(p.share_percentage) : null,
          has_settled: p.has_settled,
          created_at: p.created_at,
        }));

        const amt = Number(e.amount_minor_units);
        return {
          id: e.id,
          trip_id: e.trip_id,
          paid_by: e.paid_by || e.user_id,
          title: e.title,
          description: e.notes,
          category: e.category,
          amount_minor_units: amt,
          amount_formatted: formatCurrency(amt, { currency: e.currency, isMinor: true }),
          currency: e.currency,
          split_type: (e.split_type as any) || "equal",
          paid_at: e.paid_at,
          participants: parts,
          created_at: e.created_at,
        };
      });

      return { success: true, expenses };
    } catch (err: unknown) {
      return {
        success: false,
        expenses: [],
        error: err instanceof Error ? err.message : "Failed to load expenses.",
      };
    }
  }

  /**
   * Deletes an expense and its participant shares.
   */
  async deleteExpense(
    tripId: string,
    expenseId: string,
    callerUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    const role = await collaborationService.getUserTripRole(tripId, callerUserId);
    if (!role) return { success: false, error: "Unauthorized." };

    if (!isSupabaseLive()) {
      const exp = memoryExpenses.get(expenseId);
      if (!exp || exp.trip_id !== tripId) return { success: false, error: "Expense not found." };
      if (exp.paid_by !== callerUserId && role !== "owner") {
        return { success: false, error: "Only the payer or trip owner can delete an expense." };
      }
      memoryExpenses.delete(expenseId);
      return { success: true };
    }

    try {
      const supabase = createServerSupabase() as any;
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId)
        .eq("trip_id", tripId);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete expense.",
      };
    }
  }

  /**
   * Computes the deterministic debt settlement plan and individual net balances for a trip.
   */
  async getTripSettlement(
    tripId: string,
    callerUserId: string
  ): Promise<{ success: boolean; settlement?: SettlementResult; error?: string }> {
    const isMember = await collaborationService.isUserTripMember(tripId, callerUserId);
    if (!isMember) {
      return { success: false, error: "Unauthorized access to settlement." };
    }

    const [membersRes, expensesRes] = await Promise.all([
      collaborationService.getTripMembers(tripId, callerUserId),
      this.getTripExpenses(tripId, callerUserId),
    ]);

    if (!membersRes.success) {
      return { success: false, error: membersRes.error };
    }
    if (!expensesRes.success) {
      return { success: false, error: expensesRes.error };
    }

    const currency = expensesRes.expenses[0]?.currency || "INR";
    const result = settlementEngine.computeTripSettlement(
      tripId,
      expensesRes.expenses,
      membersRes.members,
      currency
    );

    return { success: true, settlement: result };
  }
}

export const expenseSplittingService = new ExpenseSplittingService();
