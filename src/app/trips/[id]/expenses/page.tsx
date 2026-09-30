"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  CreditCard,
  Trash2,
  X,
  Receipt,
  Utensils,
  Bed,
  Car,
  Ticket,
  ShoppingBag,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
import { useToast } from "@/components/ui/toast";
import {
  TripSplitExpense,
  TripMember,
  SettlementResult,
  ExpenseSplitType,
  ExpenseParticipantInput,
} from "@/types/collaboration";
import { formatCurrency, toMinorUnits, fromMinorUnits } from "@/lib/budget/money";

const CATEGORIES = [
  { id: "hotel", label: "Hotel / Lodging", icon: Bed },
  { id: "food", label: "Dining & Food", icon: Utensils },
  { id: "transport", label: "Transit & Flights", icon: Car },
  { id: "local_transport", label: "Local Cabs & Taxis", icon: Car },
  { id: "activities", label: "Tours & Sightseeing", icon: Ticket },
  { id: "shopping", label: "Shopping & Souvenirs", icon: ShoppingBag },
  { id: "other", label: "General & Miscellaneous", icon: HelpCircle },
];

export default function TripExpensesPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { toast } = useToast();

  const [members, setMembers] = useState<TripMember[]>([]);
  const [expenses, setExpenses] = useState<TripSplitExpense[]>([]);
  const [settlement, setSettlement] = useState<SettlementResult | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("demo-user-123");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Expense Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [category, setCategory] = useState("hotel");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState<ExpenseSplitType>("equal");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [percentageShares, setPercentageShares] = useState<Record<string, string>>({});
  const [savingExpense, setSavingExpense] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, expRes, settleRes] = await Promise.all([
        fetch(`/api/trips/${tripId}/members`),
        fetch(`/api/trips/${tripId}/expenses/split`),
        fetch(`/api/trips/${tripId}/expenses/settlement`),
      ]);

      const mData = await membersRes.json();
      const eData = await expRes.json();
      const sData = await settleRes.json();

      if (!membersRes.ok) throw new Error(mData.error || "Failed to load members");
      if (!expRes.ok) throw new Error(eData.error || "Failed to load expenses");
      if (!settleRes.ok) throw new Error(sData.error || "Failed to load settlement");

      const memberList: TripMember[] = mData.members || [];
      setMembers(memberList);
      setExpenses(eData.expenses || []);
      setSettlement(sData.settlement || null);

      if (memberList.length > 0) {
        if (!paidBy) setPaidBy(memberList[0].user_id);
        if (selectedUserIds.length === 0) {
          setSelectedUserIds(memberList.map((m) => m.user_id));
        }
        setCurrentUserId(memberList[0].user_id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tripId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // Open modal with clean defaults
  function handleOpenAddModal() {
    setTitle("");
    setAmountInput("");
    setCategory("hotel");
    if (members.length > 0) {
      setPaidBy(members[0].user_id);
      setSelectedUserIds(members.map((m) => m.user_id));
      const equalPct = (100 / members.length).toFixed(1);
      const initPct: Record<string, string> = {};
      members.forEach((m) => {
        initPct[m.user_id] = equalPct;
      });
      setPercentageShares(initPct);
      setCustomShares({});
    }
    setSplitType("equal");
    setShowAddModal(true);
  }

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    const amountVal = parseFloat(amountInput);
    if (isNaN(amountVal) || amountVal <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "warning",
      });
      return;
    }

    const amountMinor = toMinorUnits(amountVal);
    let participantsPayload: ExpenseParticipantInput[] = [];

    if (splitType === "equal") {
      const activeUserIds =
        selectedUserIds.length > 0
          ? selectedUserIds
          : members.length > 0
          ? members.map((m) => m.user_id)
          : [paidBy || "demo-user-123"];
      participantsPayload = activeUserIds.map((uid) => ({ user_id: uid }));
    } else if (splitType === "custom") {
      participantsPayload = members
        .filter((m) => Boolean(customShares[m.user_id]))
        .map((m) => ({
          user_id: m.user_id,
          share_amount_minor_units: toMinorUnits(parseFloat(customShares[m.user_id] || "0")),
        }));

      const sum = participantsPayload.reduce((s, p) => s + (p.share_amount_minor_units || 0), 0);
      if (sum !== amountMinor) {
        toast({
          title: "Sum Mismatch",
          description: `Custom shares (₹${fromMinorUnits(sum)}) must exactly equal the total amount (₹${amountVal}).`,
          variant: "warning",
        });
        return;
      }
    } else if (splitType === "percentage") {
      participantsPayload = members
        .filter((m) => Boolean(percentageShares[m.user_id]))
        .map((m) => ({
          user_id: m.user_id,
          share_percentage: parseFloat(percentageShares[m.user_id] || "0"),
        }));

      const sumPct = participantsPayload.reduce((s, p) => s + (p.share_percentage || 0), 0);
      if (Math.abs(sumPct - 100) > 0.1) {
        toast({
          title: "Percentage Mismatch",
          description: `Percentage shares (${sumPct.toFixed(1)}%) must equal 100%.`,
          variant: "warning",
        });
        return;
      }
    }

    setSavingExpense(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          amount_minor_units: amountMinor,
          currency: "INR",
          split_type: splitType,
          paid_by: paidBy || members[0]?.user_id || "demo-user-123",
          participants: participantsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create expense");

      setShowAddModal(false);
      toast({
        title: "Expense Logged",
        description: `Split ₹${amountVal} for "${title}".`,
        variant: "success",
      });
      await loadData();
    } catch (err: unknown) {
      toast({
        title: "Expense Failed",
        description: err instanceof Error ? err.message : "Failed to record expense",
        variant: "error",
      });
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    if (!confirm("Are you sure you want to delete this shared expense?")) return;
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses/split/${expenseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete expense");
      }
      toast({
        title: "Expense Deleted",
        description: "Shared expense removed and balances recalculated.",
        variant: "info",
      });
      await loadData();
    } catch (err: unknown) {
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Failed to delete expense",
        variant: "error",
      });
    }
  }

  const getPayerName = (userId: string) => {
    const m = members.find((x) => x.user_id === userId);
    return m?.full_name || m?.email || `User ${userId.substring(0, 6)}`;
  };

  const getCategoryDetails = (cat: string) => {
    return CATEGORIES.find((c) => c.id === cat) || CATEGORIES[CATEGORIES.length - 1];
  };

  // Find user balance
  const currentUserBalance = settlement?.balances.find((b) => b.user_id === currentUserId);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-rise">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 text-xs text-[hsl(215,25%,32%)] mb-1">
              <Link
                href={`/trips/${tripId}`}
                className="inline-flex items-center gap-1 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Trip Details
              </Link>
              <span>•</span>
              <Link
                href={`/trips/${tripId}/group`}
                className="inline-flex items-center gap-1 text-slate-700 hover:text-black font-medium"
              >
                <Users className="w-3.5 h-3.5" /> Group & Polls
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a] leading-none">
                Expense Splitting & Debt Settlement
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Phase 12
              </span>
            </div>
            <p className="text-[17px] text-[hsl(215,25%,32%)] font-normal mt-1">
              Fair, deterministic travel accounting: track who paid, split equally or custom, and compute exact settlements with zero arithmetic drift.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs sm:text-sm font-medium shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-transform"
          >
            <Plus className="w-3.5 h-3.5" /> Add Shared Expense
          </button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Workspace Navigation */}
        <TripWorkspaceNav tripId={tripId} />

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground">Calculating balances & debts...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-muted/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-lg">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total Spent</div>
                    <div className="text-xl font-bold">
                      {settlement?.total_expenses_formatted || "₹0"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50/40 border-blue-100 dark:bg-blue-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">You Paid</div>
                    <div className="text-xl font-bold">
                      {currentUserBalance ? formatCurrency(currentUserBalance.total_paid_minor, { currency: "INR" }) : "₹0"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50/40 border-purple-100 dark:bg-purple-950/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Your Share</div>
                    <div className="text-xl font-bold">
                      {currentUserBalance ? formatCurrency(currentUserBalance.total_share_minor, { currency: "INR" }) : "₹0"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={
                  (currentUserBalance?.net_balance_minor || 0) >= 0
                    ? "bg-emerald-50/40 border-emerald-100 dark:bg-emerald-950/20"
                    : "bg-rose-50/40 border-rose-100 dark:bg-rose-950/20"
                }
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-lg ${
                      (currentUserBalance?.net_balance_minor || 0) >= 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {(currentUserBalance?.net_balance_minor || 0) >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Your Net Balance</div>
                    <div
                      className={`text-xl font-bold ${
                        (currentUserBalance?.net_balance_minor || 0) >= 0
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {currentUserBalance ? currentUserBalance.net_balance_formatted : "₹0"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 1: Deterministic Debt Settlements ("Who Owes Whom") */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-600" /> Who Owes Whom (Settlement Plan)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Optimized minimal transactions to settle all group debts with zero confusion.
                  </p>
                </div>
              </div>

              {!settlement || settlement.settlements.length === 0 ? (
                <Card className="border-dashed p-6 text-center space-y-2 bg-emerald-50/20 border-emerald-200">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-base text-emerald-900">All Settled Up!</h3>
                  <p className="text-xs text-muted-foreground">
                    There are no outstanding debts. Everyone has paid their exact fair share.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settlement.settlements.map((s, idx) => (
                    <Card key={idx} className="border-emerald-200/80 shadow-xs bg-card hover:border-emerald-300 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {s.from_user_name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {s.from_user_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">owes</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center px-2">
                          <div className="text-base font-extrabold text-emerald-700">
                            {s.amount_formatted}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {s.to_user_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">receives</div>
                          </div>
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {s.to_user_name.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Individual Member Ledger Chips */}
              {settlement && settlement.balances.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">Member Net Balances</div>
                  <div className="flex flex-wrap gap-2">
                    {settlement.balances.map((b) => (
                      <div
                        key={b.user_id}
                        className={`text-xs px-3 py-1.5 rounded-md border flex items-center gap-2 ${
                          b.net_balance_minor > 0
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : b.net_balance_minor < 0
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <span className="font-semibold">{b.user_name}:</span>
                        <span>
                          {b.net_balance_minor > 0
                            ? `+${b.net_balance_formatted}`
                            : b.net_balance_formatted}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Shared Expenses History */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" /> Recorded Shared Expenses
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Detailed record of expenditures, payer, split mode, and individual portions.
                  </p>
                </div>
                <Button size="sm" onClick={handleOpenAddModal} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-3.5 h-3.5" /> Add Expense
                </Button>
              </div>

              {expenses.length === 0 ? (
                <Card className="border-dashed p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-base">No shared expenses yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Did someone pay for the hotel or dinner? Add the expense here and TripWise will calculate everyone&apos;s share.
                  </p>
                  <Button size="sm" onClick={handleOpenAddModal} className="gap-2">
                    <Plus className="w-4 h-4" /> Add First Expense
                  </Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => {
                    const catObj = getCategoryDetails(exp.category);
                    const CatIcon = catObj.icon;

                    return (
                      <Card key={exp.id} className="shadow-xs hover:border-emerald-200 transition-colors">
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                              <CatIcon className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm text-foreground truncate">{exp.title}</h3>
                                <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                                  {exp.split_type} split
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Paid by <strong className="text-foreground">{getPayerName(exp.paid_by)}</strong>
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {exp.participants.map((p) => (
                                  <span
                                    key={p.id}
                                    className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground"
                                  >
                                    {getPayerName(p.user_id)}:{" "}
                                    <strong className="text-foreground">
                                      {formatCurrency(p.share_amount_minor_units, { currency: exp.currency })}
                                    </strong>
                                    {p.share_percentage ? ` (${p.share_percentage}%)` : ""}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div className="text-right">
                              <div className="text-base font-extrabold text-foreground">
                                {exp.amount_formatted}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {new Date(exp.paid_at).toLocaleDateString()}
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" /> Add Shared Expense
                </CardTitle>
                <Button size="icon" variant="ghost" onClick={() => setShowAddModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Split hotel, dining, or transport costs between group members.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleCreateExpense} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hotel Stay (3 Nights)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 6000"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Paid By</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.full_name || m.email || m.user_id} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Split Mode Selector */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-xs font-semibold text-foreground">Split Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["equal", "custom", "percentage"] as ExpenseSplitType[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSplitType(st)}
                      className={`py-2 px-3 text-xs capitalize rounded-md border font-semibold transition-all ${
                        splitType === st
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {st} Split
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Details depending on Split Type */}
              {splitType === "equal" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Select who participates in this split:</span>
                    <span>{selectedUserIds.length} of {members.length} members</span>
                  </div>
                  <div className="space-y-1.5">
                    {members.map((m) => {
                      const isChecked = selectedUserIds.includes(m.user_id);
                      return (
                        <label
                          key={m.user_id}
                          className="flex items-center gap-2.5 p-2 rounded-md border text-xs cursor-pointer hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUserIds([...selectedUserIds, m.user_id]);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter((id) => id !== m.user_id));
                              }
                            }}
                            className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-medium">{m.full_name || m.email}</span>
                          {parseFloat(amountInput) > 0 && isChecked && selectedUserIds.length > 0 && (
                            <span className="ml-auto text-muted-foreground">
                              ≈ ₹{(parseFloat(amountInput) / selectedUserIds.length).toFixed(2)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {splitType === "custom" && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Enter the exact amount paid for each person:
                  </div>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.user_id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium truncate flex-1">{m.full_name || m.email}</span>
                        <div className="flex items-center gap-1 w-32">
                          <span className="text-muted-foreground">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={customShares[m.user_id] || ""}
                            onChange={(e) => {
                              setCustomShares({
                                ...customShares,
                                [m.user_id]: e.target.value,
                              });
                            }}
                            className="w-full px-2 py-1 text-xs border rounded bg-background"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {splitType === "percentage" && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Enter the percentage share for each person (must sum to 100%):
                  </div>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.user_id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium truncate flex-1">{m.full_name || m.email}</span>
                        <div className="flex items-center gap-1 w-24">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="0.0"
                            value={percentageShares[m.user_id] || ""}
                            onChange={(e) => {
                              setPercentageShares({
                                ...percentageShares,
                                [m.user_id]: e.target.value,
                              });
                            }}
                            className="w-full px-2 py-1 text-xs border rounded bg-background"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  onClick={handleCreateExpense}
                  disabled={savingExpense || !title || !amountInput}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {savingExpense ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                  Save Expense
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
