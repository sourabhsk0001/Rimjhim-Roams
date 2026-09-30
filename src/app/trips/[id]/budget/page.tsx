"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Sparkles,
  Bed,
  Plane,
  Utensils,
  Car,
  Ticket,
  ShoppingBag,
  LifeBuoy,
  MoreHorizontal,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Calculator,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
import { useToast } from "@/components/ui/toast";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  TripBudgetPageData,
  OptimizationProfile,
  DeterministicAlternative,
  BudgetCategory,
  ALL_BUDGET_CATEGORIES,
} from "@/types/budget";
import {
  formatCurrency,
  fromMinorUnits,
  toMinorUnits,
  subtractMinor,
  addMinor,
} from "@/lib/budget/money";

export default function TripBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgetData, setBudgetData] = useState<TripBudgetPageData | null>(null);
  const [selectedProfile, setSelectedProfile] =
    useState<OptimizationProfile>("Balanced");

  // Local state for interactive alternative accept/reject actions
  const [alternatives, setAlternatives] = useState<DeterministicAlternative[]>(
    []
  );
  const [categoryCostsMinor, setCategoryCostsMinor] = useState<
    Record<BudgetCategory, number>
  >({
    transport: 0,
    hotel: 0,
    food: 0,
    local_transport: 0,
    activities: 0,
    shopping: 0,
    emergency_buffer: 0,
    other: 0,
  });

  // Expense form state
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] =
    useState<BudgetCategory>("food");
  const [expensePaymentMethod, setExpensePaymentMethod] = useState("cash");
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Load initial budget details
  const loadBudget = useCallback(
    async (profile: OptimizationProfile) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/trips/${tripId}/budget?profile=${encodeURIComponent(profile)}`
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load budget.");
        }
        const data: TripBudgetPageData = json.data;
        setBudgetData(data);
        setAlternatives(data.alternatives);

        const costs: Record<BudgetCategory, number> = {
          transport: data.budgetSummary.categories.transport?.minorUnits ?? 0,
          hotel: data.budgetSummary.categories.hotel?.minorUnits ?? 0,
          food: data.budgetSummary.categories.food?.minorUnits ?? 0,
          local_transport:
            data.budgetSummary.categories.local_transport?.minorUnits ?? 0,
          activities: data.budgetSummary.categories.activities?.minorUnits ?? 0,
          shopping: data.budgetSummary.categories.shopping?.minorUnits ?? 0,
          emergency_buffer:
            data.budgetSummary.categories.emergency_buffer?.minorUnits ?? 0,
          other: data.budgetSummary.categories.other?.minorUnits ?? 0,
        };
        setCategoryCostsMinor(costs);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load budget details."
        );
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  useEffect(() => {
    if (tripId) {
      loadBudget(selectedProfile);
    }
  }, [tripId, selectedProfile, loadBudget]);

  // Handle switching optimization profile
  const handleProfileChange = (profile: OptimizationProfile) => {
    setSelectedProfile(profile);
  };

  // Handle Alternative Accept / Reject
  const handleAlternativeAction = (
    altId: string,
    action: "accept" | "reject"
  ) => {
    setAlternatives((prev) =>
      prev.map((alt) => {
        if (alt.id !== altId) return alt;

        const wasAccepted = alt.status === "accepted";
        const willBeAccepted = action === "accept";

        // Adjust category costs
        setCategoryCostsMinor((currCosts) => {
          const updated = { ...currCosts };
          const cat = alt.category;
          if (willBeAccepted && !wasAccepted) {
            // Apply savings
            updated[cat] = Math.max(
              0,
              subtractMinor(updated[cat], alt.possibleSavingsMinor)
            );
          } else if (!willBeAccepted && wasAccepted) {
            // Revert savings
            updated[cat] = addMinor(updated[cat], alt.possibleSavingsMinor);
          }
          return updated;
        });

        return {
          ...alt,
          status: willBeAccepted ? "accepted" : "rejected",
        };
      })
    );
  };

  // Handle Expense Submission
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount || Number(expenseAmount) <= 0) {
      return;
    }

    setSubmittingExpense(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: expenseCategory,
          title: expenseTitle.trim(),
          amountMajor: Number(expenseAmount),
          currency: budgetData?.currency || "INR",
          paymentMethod: expensePaymentMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to add expense");
      }

      toast({
        title: "Expense Logged",
        description: `₹${Number(expenseAmount).toLocaleString()} added to ${expenseCategory.replace("_", " ")}.`,
        type: "success",
      });
      setExpenseTitle("");
      setExpenseAmount("");
      // Reload budget data
      await loadBudget(selectedProfile);
    } catch (err: unknown) {
      toast({
        title: "Expense Notice",
        description: err instanceof Error ? err.message : "Error saving expense",
        type: "error",
      });
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Handle Expense Deletion
  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const res = await fetch(
        `/api/trips/${tripId}/budget?expenseId=${expenseId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast({
          title: "Expense Removed",
          description: "Expense deleted and ledger updated.",
          type: "info",
        });
        await loadBudget(selectedProfile);
      }
    } catch {
      toast({
        title: "Delete Failed",
        description: "Failed to delete expense",
        type: "error",
      });
    }
  };

  // Dynamic calculations based on active categoryCostsMinor
  const currentTotalMinor = ALL_BUDGET_CATEGORIES.reduce(
    (acc, cat) => acc + (categoryCostsMinor[cat] || 0),
    0
  );
  const budgetMinor = budgetData?.budgetSummary.budgetMinor || 0;
  const currency = budgetData?.currency || "INR";
  const remainingMinor = budgetMinor - currentTotalMinor;
  const isOverBudget = remainingMinor < 0;
  const overBudgetMinor = isOverBudget ? Math.abs(remainingMinor) : 0;

  const getCategoryIcon = (category: BudgetCategory) => {
    switch (category) {
      case "transport":
        return <Plane className="w-4 h-4 text-blue-500" />;
      case "hotel":
        return <Bed className="w-4 h-4 text-amber-500" />;
      case "food":
        return <Utensils className="w-4 h-4 text-emerald-500" />;
      case "local_transport":
        return <Car className="w-4 h-4 text-indigo-500" />;
      case "activities":
        return <Ticket className="w-4 h-4 text-purple-500" />;
      case "shopping":
        return <ShoppingBag className="w-4 h-4 text-rose-500" />;
      case "emergency_buffer":
        return <LifeBuoy className="w-4 h-4 text-orange-500" />;
      default:
        return <MoreHorizontal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-rise">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1.5">
            <Link
              href={`/trips/${tripId}`}
              className="inline-flex items-center gap-1.5 text-xs text-[hsl(215,25%,32%)] hover:text-black transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Itinerary Details
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a] leading-none">
                Budget & Optimization Engine
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Phase 4 Deterministic
              </span>
            </div>
            {budgetData && (
              <p className="text-[17px] text-[hsl(215,25%,32%)] font-normal mt-1">
                {budgetData.origin} → {budgetData.destination} • {budgetData.durationDays} days • {budgetData.travellerCount} travelers
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={async () => {
              await loadBudget(selectedProfile);
              toast({
                title: "Budget Recalculated",
                description: "All 8 categories updated.",
                type: "info",
              });
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-white text-xs sm:text-sm font-medium text-slate-900 shadow-xs hover:bg-slate-50 hover:scale-[1.03] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Recalculate
          </button>
        </div>

        {/* Unified Module Nav */}
        <TripWorkspaceNav tripId={tripId} />

        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Budget Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !budgetData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Executing deterministic integer arithmetic & ledger reconciliation...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ) : budgetData ? (
          <>
            {/* Over-Budget Alert Banner */}
            {isOverBudget && (
              <Alert className="border-rose-400 bg-rose-50/90 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100 rounded-2xl shadow-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <AlertTitle className="text-base font-bold text-rose-800 dark:text-rose-300">
                  Over-Budget Warning: Projected Cost Exceeds Allocated Budget
                </AlertTitle>
                <AlertDescription className="text-sm mt-1">
                  The projected trip cost is{" "}
                  <strong>
                    {formatCurrency(overBudgetMinor, { isMinor: true, currency })}
                  </strong>{" "}
                  higher than your budget of{" "}
                  {formatCurrency(budgetMinor, { isMinor: true, currency })}.
                  Accept one or more deterministic alternatives below to bring your trip back under budget.
                </AlertDescription>
              </Alert>
            )}

            {/* Top KPI Summary Cards - Explicit 4-State Visual Differentiation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* State 1: Estimated */}
              <Card className="rounded-2xl border bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs uppercase font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5" /> Allocated Budget
                    </CardDescription>
                    <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700 bg-blue-100/50 dark:bg-blue-900/50">
                      Estimated
                    </Badge>
                  </div>
                  <CardTitle className="font-instrument text-3xl font-normal text-blue-950 dark:text-blue-100 tracking-tight mt-1">
                    {formatCurrency(budgetMinor, { isMinor: true, currency })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-700 dark:text-blue-300">
                  Baseline cap set for itinerary
                </CardContent>
              </Card>

              {/* State 2: Actual Spent */}
              <Card className="rounded-2xl border bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs uppercase font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5" /> Logged Spend
                    </CardDescription>
                    <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-100/50 dark:bg-emerald-900/50">
                      Actual
                    </Badge>
                  </div>
                  <CardTitle className="font-instrument text-3xl font-normal text-emerald-950 dark:text-emerald-100 tracking-tight mt-1">
                    {budgetData.totalExpensesFormatted}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-emerald-700 dark:text-emerald-300">
                  {budgetData.expenses.length} logged expense item(s)
                </CardContent>
              </Card>

              {/* State 3: Remaining Buffer */}
              <Card className="rounded-2xl border bg-sky-50/60 dark:bg-sky-950/30 border-sky-200 dark:border-sky-900 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="text-xs uppercase font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5" /> Remaining Buffer
                    </CardDescription>
                    <Badge variant="outline" className="text-[10px] border-sky-300 text-sky-700 bg-sky-100/50 dark:bg-sky-900/50">
                      Remaining
                    </Badge>
                  </div>
                  <CardTitle className="font-instrument text-3xl font-normal text-sky-950 dark:text-sky-100 tracking-tight mt-1">
                    {isOverBudget ? "₹0.00" : formatCurrency(remainingMinor, { isMinor: true, currency })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-sky-700 dark:text-sky-300">
                  {isOverBudget ? "Deficit active" : "Available surplus"}
                </CardContent>
              </Card>

              {/* State 4: Over Budget Deficit / Health State */}
              <Card
                className={`rounded-2xl border shadow-sm ${
                  isOverBudget
                    ? "bg-rose-50/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-900 ring-1 ring-rose-400 text-rose-950"
                    : "bg-card border-muted"
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription
                      className={`text-xs uppercase font-semibold flex items-center gap-1.5 ${
                        isOverBudget ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground"
                      }`}
                    >
                      {isOverBudget ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      {isOverBudget ? "Over Budget Deficit" : "Budget Health"}
                    </CardDescription>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        isOverBudget
                          ? "border-rose-300 text-rose-700 bg-rose-100 dark:bg-rose-900/50"
                          : "border-emerald-300 text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50"
                      }`}
                    >
                      {isOverBudget ? "Over Budget" : "Healthy"}
                    </Badge>
                  </div>
                  <CardTitle
                    className={`text-2xl font-black tracking-tight mt-1 ${
                      isOverBudget ? "text-rose-700 dark:text-rose-300" : "text-foreground"
                    }`}
                  >
                    {isOverBudget
                      ? `-${formatCurrency(overBudgetMinor, { isMinor: true, currency })}`
                      : "Balanced"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {isOverBudget
                    ? "Excess requires alternative swaps"
                    : `Projected spend: ${formatCurrency(currentTotalMinor, { isMinor: true, currency })}`}
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Deterministic Category Breakdown
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Calculated using integer minor units without floating-point drift.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ALL_BUDGET_CATEGORIES.map((cat) => {
                  const minor = categoryCostsMinor[cat] || 0;
                  const pct =
                    currentTotalMinor > 0
                      ? Math.round((minor / currentTotalMinor) * 1000) / 10
                      : 0;

                  return (
                    <Card key={cat} className="bg-card">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="p-2 rounded-lg bg-muted">
                            {getCategoryIcon(cat)}
                          </span>
                          <span className="text-xs font-semibold text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                        <CardTitle className="text-base font-semibold capitalize mt-2">
                          {cat.replace("_", " ")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="text-lg font-bold">
                          {formatCurrency(minor, { isMinor: true, currency })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Optimization Engine & Alternatives Section */}
            <div className="space-y-6 pt-4 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Optimization Profiles & Deterministic Alternatives
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Select a travel optimization profile to evaluate rule-based cost and time tradeoffs.
                  </p>
                </div>

                {/* Profile Selector */}
                <div className="inline-flex p-1 bg-muted rounded-xl gap-1">
                  {(
                    [
                      "Budget Saver",
                      "Time Saver",
                      "Experience Maximizer",
                      "Balanced",
                    ] as OptimizationProfile[]
                  ).map((profile) => (
                    <button
                      key={profile}
                      onClick={() => handleProfileChange(profile)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        selectedProfile === profile
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {profile}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alternatives List */}
              <div className="space-y-4">
                {alternatives.length === 0 ? (
                  <Card className="p-8 text-center border-dashed">
                    <p className="text-muted-foreground text-sm">
                      No optimization alternatives required. Your budget allocation is balanced.
                    </p>
                  </Card>
                ) : (
                  alternatives.map((alt) => {
                    const isAccepted = alt.status === "accepted";
                    const isRejected = alt.status === "rejected";

                    return (
                      <Card
                        key={alt.id}
                        className={`transition-all ${
                          isAccepted
                            ? "border-emerald-500 bg-emerald-50/20"
                            : isRejected
                            ? "opacity-60 bg-muted/30"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    isAccepted
                                      ? "default"
                                      : isRejected
                                      ? "outline"
                                      : "secondary"
                                  }
                                  className="text-xs capitalize"
                                >
                                  {alt.actionType.replace("_", " ")}
                                </Badge>
                                {isAccepted && (
                                  <Badge className="bg-emerald-600 text-white text-xs">
                                    Savings Applied
                                  </Badge>
                                )}
                              </div>
                              <CardTitle className="text-base font-bold">
                                {alt.title}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {alt.description}
                              </CardDescription>
                            </div>

                            {/* Cost & Savings Summary Badge */}
                            <div className="sm:text-right shrink-0">
                              <div className="text-sm font-semibold text-emerald-600 flex items-center sm:justify-end gap-1">
                                <TrendingDown className="w-4 h-4" />
                                Save {alt.possibleSavingsFormatted}
                              </div>
                              <div className="text-xs text-muted-foreground line-through">
                                Was {alt.currentCostFormatted}
                              </div>
                              <div className="text-xs font-medium text-foreground">
                                Now {alt.proposedCostFormatted}
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4 pt-0">
                          {/* Tradeoffs Card */}
                          <div className="p-3 rounded-lg bg-muted/60 text-xs border border-muted-foreground/10 space-y-1">
                            <span className="font-semibold text-foreground">
                              Trade-offs & Considerations:
                            </span>
                            <p className="text-muted-foreground">
                              {alt.tradeOffs}
                            </p>
                          </div>

                          {/* Accept / Reject Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t">
                            <Button
                              variant={isRejected ? "secondary" : "outline"}
                              size="sm"
                              onClick={() =>
                                handleAlternativeAction(alt.id, "reject")
                              }
                              className="text-xs h-8"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                              {isRejected ? "Rejected" : "Reject"}
                            </Button>

                            <Button
                              variant={isAccepted ? "default" : "default"}
                              size="sm"
                              onClick={() =>
                                handleAlternativeAction(alt.id, "accept")
                              }
                              className={`text-xs h-8 ${
                                isAccepted
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : ""
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              {isAccepted ? "Accepted" : "Accept Alternative"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actual Expenses Tracker Section */}
            <div className="space-y-6 pt-6 border-t">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  Expense Tracker & Ledger
                </h2>
                <p className="text-xs text-muted-foreground">
                  Record actual out-of-pocket travel expenses and keep tab of real-world spend.
                </p>
              </div>

              {/* Add Expense Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Log an Expenditure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleAddExpense}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
                  >
                    <div className="space-y-1">
                      <Label htmlFor="category" className="text-xs">
                        Category
                      </Label>
                      <select
                        id="category"
                        value={expenseCategory}
                        onChange={(e) =>
                          setExpenseCategory(e.target.value as BudgetCategory)
                        }
                        className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
                      >
                        {ALL_BUDGET_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <Label htmlFor="title" className="text-xs">
                        Description / Vendor
                      </Label>
                      <Input
                        id="title"
                        placeholder="e.g. Traditional Goan Fish Thali"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="text-xs h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="amount" className="text-xs">
                        Amount ({currency})
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="e.g. 650"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        className="text-xs h-9"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingExpense}
                      className="text-xs h-9"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {submittingExpense ? "Recording..." : "Record Expense"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Expense Ledger Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Recorded Expenses ({budgetData.expenses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {budgetData.expenses.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">
                      No expenses logged yet. Add your first expenditure above.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {budgetData.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between p-4 text-xs hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-2 rounded-lg bg-muted">
                              {getCategoryIcon(exp.category)}
                            </span>
                            <div>
                              <div className="font-semibold text-foreground">
                                {exp.title}
                              </div>
                              <div className="text-muted-foreground capitalize">
                                {exp.category.replace("_", " ")} •{" "}
                                {new Date(exp.paid_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right font-bold text-foreground">
                              {formatCurrency(exp.amount_minor_units, {
                                isMinor: true,
                                currency: exp.currency,
                              })}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-muted-foreground hover:text-rose-600 h-8 w-8 p-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
