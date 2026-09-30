// ==============================================================================
// Phase 12: Deterministic Expense Splitting & Debt Settlement Engine
// ==============================================================================

import {
  ExpenseSplitType,
  ExpenseParticipantInput,
  TripSplitExpense,
  UserBalance,
  DebtTransfer,
  SettlementResult,
  TripMember,
} from "@/types/collaboration";
import { formatCurrency } from "@/lib/budget/money";

export class SettlementEngine {
  /**
   * Deterministically distributes an expense among participants according to split type.
   * Ensures that the sum of calculated minor-unit shares strictly matches totalAmountMinor.
   */
  calculateParticipantShares(
    totalAmountMinor: number,
    splitType: ExpenseSplitType,
    participants: ExpenseParticipantInput[]
  ): Array<{
    user_id: string;
    share_amount_minor_units: number;
    share_percentage?: number | null;
  }> {
    if (!participants || participants.length === 0) {
      throw new Error("Cannot split expense with zero participants.");
    }

    if (totalAmountMinor < 0) {
      throw new Error("Expense amount must be non-negative.");
    }

    if (totalAmountMinor === 0) {
      return participants.map((p) => ({
        user_id: p.user_id,
        share_amount_minor_units: 0,
        share_percentage: 0,
      }));
    }

    const count = participants.length;

    // 1. Equal Split
    if (splitType === "equal") {
      const baseShare = Math.floor(totalAmountMinor / count);
      let remainder = totalAmountMinor % count;

      return participants.map((p) => {
        let share = baseShare;
        if (remainder > 0) {
          share += 1;
          remainder -= 1;
        }
        const percentage = Math.round((share / totalAmountMinor) * 10000) / 100;
        return {
          user_id: p.user_id,
          share_amount_minor_units: share,
          share_percentage: percentage,
        };
      });
    }

    // 2. Custom Split (Explicit minor unit amounts per participant)
    if (splitType === "custom") {
      let allocatedSum = 0;
      const result = participants.map((p) => {
        const share = p.share_amount_minor_units ?? 0;
        if (share < 0) {
          throw new Error(`Participant ${p.user_id} cannot have negative share.`);
        }
        allocatedSum += share;
        const percentage = Math.round((share / totalAmountMinor) * 10000) / 100;
        return {
          user_id: p.user_id,
          share_amount_minor_units: share,
          share_percentage: percentage,
        };
      });

      if (allocatedSum !== totalAmountMinor) {
        throw new Error(
          `Custom split mismatch: sum of shares (${allocatedSum}) does not equal total amount (${totalAmountMinor}).`
        );
      }

      return result;
    }

    // 3. Percentage Split
    if (splitType === "percentage") {
      let percentSum = 0;
      for (const p of participants) {
        const pct = p.share_percentage ?? 0;
        if (pct < 0) {
          throw new Error(`Participant ${p.user_id} cannot have negative percentage.`);
        }
        percentSum += pct;
      }

      // Check percentage sums to 100 (allowing minor floating precision tolerance of 0.05%)
      if (Math.abs(percentSum - 100) > 0.05) {
        throw new Error(
          `Percentage split mismatch: sum of percentages (${percentSum}%) must equal 100%.`
        );
      }

      let distributedMinor = 0;
      const preliminaryShares = participants.map((p) => {
        const pct = p.share_percentage ?? 0;
        const minorShare = Math.round((totalAmountMinor * pct) / 100);
        distributedMinor += minorShare;
        return {
          user_id: p.user_id,
          share_amount_minor_units: minorShare,
          share_percentage: pct,
        };
      });

      // Adjust rounding discrepancy to the participant with the largest percentage
      const discrepancy = totalAmountMinor - distributedMinor;
      if (discrepancy !== 0 && preliminaryShares.length > 0) {
        let maxIdx = 0;
        let maxPct = -1;
        for (let i = 0; i < preliminaryShares.length; i++) {
          if ((preliminaryShares[i].share_percentage ?? 0) > maxPct) {
            maxPct = preliminaryShares[i].share_percentage ?? 0;
            maxIdx = i;
          }
        }
        preliminaryShares[maxIdx].share_amount_minor_units += discrepancy;
      }

      return preliminaryShares;
    }

    throw new Error(`Unsupported split type: ${splitType}`);
  }

  /**
   * Calculates individual balances for all trip members across all recorded split expenses.
   */
  calculateBalances(
    expenses: TripSplitExpense[],
    members: TripMember[],
    currency: string = "INR"
  ): UserBalance[] {
    const userMap = new Map<
      string,
      {
        name: string;
        paid: number;
        share: number;
      }
    >();

    // Initialize with known members
    for (const m of members) {
      userMap.set(m.user_id, {
        name: m.full_name || m.email || `User ${m.user_id.substring(0, 6)}`,
        paid: 0,
        share: 0,
      });
    }

    // Accumulate expenditures and shares from each expense
    for (const exp of expenses) {
      // 1. Credit the payer
      if (!userMap.has(exp.paid_by)) {
        userMap.set(exp.paid_by, {
          name: exp.paid_by_name || `User ${exp.paid_by.substring(0, 6)}`,
          paid: 0,
          share: 0,
        });
      }
      const payerEntry = userMap.get(exp.paid_by)!;
      payerEntry.paid += exp.amount_minor_units;

      // 2. Debit the participants
      for (const part of exp.participants) {
        if (!userMap.has(part.user_id)) {
          userMap.set(part.user_id, {
            name: part.user_name || `User ${part.user_id.substring(0, 6)}`,
            paid: 0,
            share: 0,
          });
        }
        const partEntry = userMap.get(part.user_id)!;
        partEntry.share += part.share_amount_minor_units;
      }
    }

    // Produce structured UserBalance array
    const balances: UserBalance[] = [];
    for (const [userId, stats] of Array.from(userMap.entries())) {
      const net = stats.paid - stats.share;
      balances.push({
        user_id: userId,
        user_name: stats.name,
        total_paid_minor: stats.paid,
        total_share_minor: stats.share,
        net_balance_minor: net,
        net_balance_formatted: formatCurrency(net, { currency, isMinor: true }),
      });
    }

    // Sort by net balance descending (largest creditors first, debtors last)
    return balances.sort((a, b) => b.net_balance_minor - a.net_balance_minor);
  }

  /**
   * Generates a minimal debt transfer settlement plan using greedy two-pointer reconciliation.
   * Example: Hotel ₹6,000 paid by A, split among A, B, C:
   * Result: B owes A ₹2,000; C owes A ₹2,000.
   */
  calculateSettlements(balances: UserBalance[], currency: string = "INR"): DebtTransfer[] {
    // Separate creditors (positive net) and debtors (negative net)
    const creditors: Array<{ userId: string; userName: string; remaining: number }> = [];
    const debtors: Array<{ userId: string; userName: string; remaining: number }> = [];

    for (const b of balances) {
      if (b.net_balance_minor > 0) {
        creditors.push({
          userId: b.user_id,
          userName: b.user_name,
          remaining: b.net_balance_minor,
        });
      } else if (b.net_balance_minor < 0) {
        debtors.push({
          userId: b.user_id,
          userName: b.user_name,
          remaining: Math.abs(b.net_balance_minor),
        });
      }
    }

    // Sort creditors descending, debtors descending
    creditors.sort((a, b) => b.remaining - a.remaining);
    debtors.sort((a, b) => b.remaining - a.remaining);

    const settlements: DebtTransfer[] = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx];
      const debtor = debtors[dIdx];

      const transferAmount = Math.min(creditor.remaining, debtor.remaining);

      if (transferAmount > 0) {
        const formatted = formatCurrency(transferAmount, { currency, isMinor: true });
        settlements.push({
          from_user_id: debtor.userId,
          from_user_name: debtor.userName,
          to_user_id: creditor.userId,
          to_user_name: creditor.userName,
          amount_minor: transferAmount,
          amount_formatted: formatted,
          currency,
          description: `${debtor.userName} owes ${creditor.userName} ${formatted}`,
        });

        creditor.remaining -= transferAmount;
        debtor.remaining -= transferAmount;
      }

      if (creditor.remaining === 0) {
        cIdx++;
      }
      if (debtor.remaining === 0) {
        dIdx++;
      }
    }

    return settlements;
  }

  /**
   * Complete settlement calculation wrapper for a trip.
   */
  computeTripSettlement(
    tripId: string,
    expenses: TripSplitExpense[],
    members: TripMember[],
    currency: string = "INR"
  ): SettlementResult {
    const totalExpensesMinor = expenses.reduce((sum, e) => sum + e.amount_minor_units, 0);
    const balances = this.calculateBalances(expenses, members, currency);
    const settlements = this.calculateSettlements(balances, currency);

    return {
      trip_id: tripId,
      currency,
      total_expenses_minor: totalExpensesMinor,
      total_expenses_formatted: formatCurrency(totalExpensesMinor, { currency, isMinor: true }),
      balances,
      settlements,
      is_all_settled: settlements.length === 0,
    };
  }
}

export const settlementEngine = new SettlementEngine();
