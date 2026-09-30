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

      setExpenseTitle("");
      setExpenseAmount("");
      // Reload budget data
      await loadBudget(selectedProfile);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error saving expense");
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Handle Expense Deletion
  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const res = await fetch(
        `/api/trips/${tripId}/budget?expenseId=${expenseId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await loadBudget(selectedProfile);
      }
    } catch {
      alert("Failed to delete expense");
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
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <Link
              href={`/trips/${tripId}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Itinerary Details
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">
                Budget & Optimization Engine
              </h1>
              <Badge variant="outline" className="text-xs uppercase bg-emerald-50 text-emerald-700 border-emerald-300">
                Phase 4 Deterministic
              </Badge>
            </div>
            {budgetData && (
              <p className="text-sm text-muted-foreground">
                {budgetData.origin} → {budgetData.destination} • {budgetData.durationDays} days • {budgetData.travellerCount} travelers
              </p>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadBudget(selectedProfile)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Budget Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !budgetData ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Executing deterministic cost calculations...
            </p>
          </div>
        ) : budgetData ? (
          <>
            {/* Over-Budget Alert Banner */}
            {isOverBudget && (
              <Alert className="border-rose-500/50 bg-rose-500/10 text-rose-950 dark:text-rose-200">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <AlertTitle className="text-base font-bold text-rose-700 dark:text-rose-300">
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

            {/* Top KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Budget */}
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase font-medium">
                    Allocated Budget
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {formatCurrency(budgetMinor, { isMinor: true, currency })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Baseline cap set for itinerary
                </CardContent>
              </Card>

              {/* Card 2: Projected Total Cost */}
              <Card className={isOverBudget ? "border-rose-400" : "border-muted"}>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase font-medium">
                    Projected Total Cost
                  </CardDescription>
                  <CardTitle
                    className={`text-2xl font-bold ${
                      isOverBudget ? "text-rose-600" : "text-foreground"
                    }`}
                  >
                    {formatCurrency(currentTotalMinor, { isMinor: true, currency })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {isOverBudget
                    ? `Over budget by ${formatCurrency(overBudgetMinor, {
                        isMinor: true,
                        currency,
                      })}`
                    : `Well within budget limit`}
                </CardContent>
              </Card>

              {/* Card 3: Remaining / Difference */}
              <Card className={isOverBudget ? "bg-rose-50/50" : "bg-emerald-50/50"}>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase font-medium">
                    {isOverBudget ? "Excess Over Budget" : "Remaining Buffer"}
                  </CardDescription>
                  <CardTitle
                    className={`text-2xl font-bold ${
                      isOverBudget ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {isOverBudget
                      ? `-${formatCurrency(overBudgetMinor, {
                          isMinor: true,
                          currency,
                        })}`
                      : formatCurrency(remainingMinor, {
                          isMinor: true,
                          currency,
                        })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {isOverBudget ? "Savings required" : "Available surplus"}
                </CardContent>
              </Card>

              {/* Card 4: Actual Logged Expenses */}
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs uppercase font-medium">
                    Actual Spent So Far
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {budgetData.totalExpensesFormatted}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {budgetData.expenses.length} logged expense item(s)
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
