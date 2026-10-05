// ==============================================================================
// Trip Collaboration, Group Voting & Expense Splitting Domain Types
// ==============================================================================

export type TripMemberRole = "owner" | "editor" | "viewer";

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: TripMemberRole;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface TripInvitation {
  id: string;
  trip_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_user_id?: string | null;
  role: TripMemberRole;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Group Voting & Polls
// ------------------------------------------------------------------------------

export interface GroupPollOption {
  id: string;
  title: string;
  votes_count: number;
  voter_user_ids: string[];
}

export type PollStatus = "active" | "closed";

export interface GroupPoll {
  id: string;
  trip_id: string;
  creator_id: string;
  creator_name?: string;
  title: string;
  description?: string | null;
  options: GroupPollOption[];
  status: PollStatus;
  deadline?: string | null;
  total_votes: number;
  winning_option?: GroupPollOption | null;
  user_voted_option_id?: string | null;
  created_at: string;
}

export interface GroupVote {
  id: string;
  poll_id: string;
  trip_id: string;
  user_id: string;
  option_id: string;
  created_at: string;
}

// ------------------------------------------------------------------------------
// Expense Splitting & Deterministic Settlement
// ------------------------------------------------------------------------------

export type ExpenseSplitType = "equal" | "custom" | "percentage";

export interface ExpenseParticipantInput {
  user_id: string;
  share_amount_minor_units?: number;
  share_percentage?: number;
}

export interface ExpenseParticipant {
  id: string;
  expense_id: string;
  trip_id: string;
  user_id: string;
  user_name?: string;
  share_amount_minor_units: number;
  share_percentage?: number | null;
  has_settled: boolean;
  created_at: string;
}

export interface CreateSplitExpenseInput {
  trip_id: string;
  paid_by: string;
  title: string;
  description?: string;
  category: string;
  amount_minor_units: number;
  currency?: string;
  split_type: ExpenseSplitType;
  participants: ExpenseParticipantInput[];
  paid_at?: string;
}

export interface TripSplitExpense {
  id: string;
  trip_id: string;
  paid_by: string;
  paid_by_name?: string;
  title: string;
  description?: string | null;
  category: string;
  amount_minor_units: number;
  amount_formatted: string;
  currency: string;
  split_type: ExpenseSplitType;
  paid_at: string;
  participants: ExpenseParticipant[];
  created_at: string;
}

export interface UserBalance {
  user_id: string;
  user_name: string;
  total_paid_minor: number;
  total_share_minor: number;
  net_balance_minor: number; // positive = owed money (+), negative = owes money (-)
  net_balance_formatted: string;
}

export interface DebtTransfer {
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount_minor: number;
  amount_formatted: string;
  currency: string;
  description: string; // e.g. "B owes A ₹2,000"
}

export interface SettlementResult {
  trip_id: string;
  currency: string;
  total_expenses_minor: number;
  total_expenses_formatted: string;
  balances: UserBalance[];
  settlements: DebtTransfer[];
  is_all_settled: boolean;
}
