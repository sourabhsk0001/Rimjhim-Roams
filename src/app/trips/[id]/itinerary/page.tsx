"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Car,
  Utensils,
  Coffee,
  Ticket,
  Eye,
  Hourglass,
  Shield,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Wallet,
  ArrowRight,
  Info,
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
  ItineraryItem,
  DayItineraryData,
  ScheduleValidationResult,
  ItineraryItemCategory,
  DurationTier,
  ItemPriority,
} from "@/types/time";
import { ReplanModal } from "@/components/travel/replan-modal";

export default function TripItineraryPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DayItineraryData[]>([]);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [currentDay, setCurrentDay] = useState<DayItineraryData | null>(null);
  const [validation, setValidation] = useState<ScheduleValidationResult | null>(null);

  // Re-plan My Day Modal state
  const [showReplanModal, setShowReplanModal] = useState(false);

  // Optimizing state
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationSummary, setOptimizationSummary] = useState<string[] | null>(null);

  // Add Item Form Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addCategory, setAddCategory] = useState<ItineraryItemCategory>("sightseeing");
  const [addStartTime, setAddStartTime] = useState("10:00");
  const [addEndTime, setAddEndTime] = useState("11:30");
  const [addVisitMinutes, setAddVisitMinutes] = useState(90);
  const [addTravelMinutes, setAddTravelMinutes] = useState(15);
  const [addLocationName, setAddLocationName] = useState("");
  const [addDurationTier, setAddDurationTier] = useState<DurationTier>("Normal");
  const [addPriority, setAddPriority] = useState<ItemPriority>("high");
  const [submittingItem, setSubmittingItem] = useState(false);

  // Fetch Day Data
  const loadDay = useCallback(
    async (dayNum: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/${tripId}/itinerary?day=${dayNum}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load itinerary day.");
        }
        setCurrentDay(data.day);
        setValidation(data.validation);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading schedule");
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  // Fetch All Days for Header Tabs
  const loadAllDays = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`);
      const data = await res.json();
      if (res.ok && data.days) {
        setDays(data.days);
      }
    } catch {
      // Non-fatal
    }
  }, [tripId]);

  useEffect(() => {
    if (tripId) {
      loadAllDays();
      loadDay(selectedDayNumber);
    }
  }, [tripId, selectedDayNumber, loadAllDays, loadDay]);

  // Handle "Optimize Day" action
  const handleOptimizeDay = async () => {
    setOptimizing(true);
    setOptimizationSummary(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimize",
          dayNumber: selectedDayNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to optimize schedule.");
      }

      setOptimizationSummary(data.result.changesMade || ["Day schedule optimized."]);
      await loadDay(selectedDayNumber);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Optimization failed.");
    } finally {
      setOptimizing(false);
    }
  };

  // Handle Adding Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTitle.trim() || !addLocationName.trim()) return;

    setSubmittingItem(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayNumber: selectedDayNumber,
          item: {
            title: addTitle.trim(),
            category: addCategory,
            start_time: addStartTime,
            end_time: addEndTime,
            location: {
              latitude: 26.9124,
              longitude: 75.7873,
              name: addLocationName.trim(),
            },
            visit_minutes: Number(addVisitMinutes),
            travel_minutes: Number(addTravelMinutes),
            duration_tier: addDurationTier,
            priority: addPriority,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add itinerary item.");
      }

      setShowAddModal(false);
      setAddTitle("");
      setAddLocationName("");
      await loadDay(selectedDayNumber);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error adding item");
    } finally {
      setSubmittingItem(false);
    }
  };

  // Handle Deleting Item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to remove this item from the schedule?")) return;
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary?itemId=${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadDay(selectedDayNumber);
      }
    } catch {
      alert("Failed to delete item.");
    }
  };

  const getCategoryColor = (cat: ItineraryItemCategory) => {
    switch (cat) {
      case "food":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300";
      case "rest":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300";
      case "travel":
        return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-300";
      case "activity":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-300";
      case "sightseeing":
      default:
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300";
    }
  };

  const getCategoryIcon = (cat: ItineraryItemCategory) => {
    switch (cat) {
      case "food":
        return <Utensils className="w-4 h-4 text-emerald-600" />;
      case "rest":
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case "travel":
        return <Car className="w-4 h-4 text-indigo-600" />;
      case "activity":
        return <Ticket className="w-4 h-4 text-purple-600" />;
      case "sightseeing":
      default:
        return <Eye className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Navigation & Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
              <Link
                href={`/trips/${tripId}`}
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Trip Details
              </Link>
              <span>•</span>
              <Link
                href={`/trips/${tripId}/budget`}
                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Wallet className="w-3.5 h-3.5" /> Budget Engine
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight">
                Time Intelligence Engine
              </h1>
              <Badge variant="outline" className="text-xs uppercase bg-purple-50 text-purple-700 border-purple-300">
                Phase 5 Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Guarantees physical feasibility: separate visit, travel, waiting, and buffer allocations preventing impossible itineraries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-1.5 text-xs h-9"
            >
              <Plus className="w-3.5 h-3.5" /> Add Block
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReplanModal(true)}
              className="gap-2 text-xs h-9 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/40 shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              Re-plan My Day
            </Button>

            <Button
              size="sm"
              onClick={handleOptimizeDay}
              disabled={optimizing || loading}
              className="gap-2 text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              <Sparkles className={`w-3.5 h-3.5 ${optimizing ? "animate-spin" : ""}`} />
              {optimizing ? "Optimizing..." : "Optimize Day"}
            </Button>
          </div>
        </div>

        {/* Day Selector Tabs */}
        {days.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b">
            {days.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDayNumber(d.day_number)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedDayNumber === d.day_number
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Day {d.day_number}</span>
                <span className="opacity-75 text-[10px]">({d.date})</span>
              </button>
            ))}
          </div>
        )}

        {/* Optimization Changelog Banner */}
        {optimizationSummary && (
          <Alert className="border-purple-300 bg-purple-50/50 text-purple-900 dark:text-purple-200">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <AlertTitle className="text-sm font-bold text-purple-800 dark:text-purple-300">
              Day Optimized Successfully
            </AlertTitle>
            <AlertDescription className="text-xs space-y-1 mt-1">
              {optimizationSummary.map((change, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>{change}</span>
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Schedule Validation Alerts & Warnings */}
        {validation && !validation.isValid && (
          <div className="space-y-3">
            {validation.errors.map((err) => (
              <Alert key={err.id} variant="destructive">
                <ShieldAlert className="w-5 h-5" />
                <AlertTitle className="text-sm font-bold">
                  Schedule Infeasible: {err.type.replace("_", " ").toUpperCase()}
                </AlertTitle>
                <AlertDescription className="text-xs mt-1 space-y-1">
                  <p>{err.message}</p>
                  <p className="font-semibold text-rose-200">Suggested Fix: {err.suggestedFix}</p>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {validation && validation.warnings.length > 0 && (
          <div className="space-y-3">
            {validation.warnings.map((warn) => (
              <Alert key={warn.id} className="border-amber-400 bg-amber-50/50 text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <AlertTitle className="text-sm font-bold">
                  Schedule Notice: {warn.type.replace("_", " ")}
                </AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  {warn.message} — <span className="font-semibold">{warn.suggestedFix}</span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Evaluating time intelligence models...</p>
          </div>
        ) : currentDay ? (
          <>
            {/* Daily Time Allocation Cards */}
            {validation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold tracking-tight">
                    Daily Time Allocation ({currentDay.day_start_time.slice(0, 5)} - {currentDay.day_end_time.slice(0, 5)})
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Capacity: {Math.round((validation.allocation.dayCapacityMinutes / 60) * 10) / 10} hours
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {/* Sightseeing */}
                  <Card className="p-3 bg-blue-50/30 border-blue-200">
                    <div className="text-[10px] uppercase font-semibold text-blue-700 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Sightseeing
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {validation.allocation.sightseeingMinutes}m
                    </div>
                  </Card>

                  {/* Travel */}
                  <Card className="p-3 bg-indigo-50/30 border-indigo-200">
                    <div className="text-[10px] uppercase font-semibold text-indigo-700 flex items-center gap-1">
                      <Car className="w-3 h-3" /> Travel
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {validation.allocation.travelMinutes}m
                    </div>
                  </Card>

                  {/* Food */}
                  <Card className="p-3 bg-emerald-50/30 border-emerald-200">
                    <div className="text-[10px] uppercase font-semibold text-emerald-700 flex items-center gap-1">
                      <Utensils className="w-3 h-3" /> Food
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {validation.allocation.foodMinutes}m
                    </div>
                  </Card>

                  {/* Rest */}
                  <Card className="p-3 bg-amber-50/30 border-amber-200">
                    <div className="text-[10px] uppercase font-semibold text-amber-700 flex items-center gap-1">
                      <Coffee className="w-3 h-3" /> Rest
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {validation.allocation.restMinutes}m
                    </div>
                  </Card>

                  {/* Waiting */}
                  <Card className="p-3 bg-orange-50/30 border-orange-200">
                    <div className="text-[10px] uppercase font-semibold text-orange-700 flex items-center gap-1">
                      <Hourglass className="w-3 h-3" /> Waiting
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {validation.allocation.waitingMinutes}m
                    </div>
                  </Card>

                  {/* Buffer */}
                  <Card className="p-3 bg-teal-50/30 border-teal-200">
                    <div className="text-[10px] uppercase font-semibold text-teal-700 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Buffer
                    </div>
                    <div className="text-lg font-bold text-foreground mt-1">
                      {validation.allocation.bufferMinutes}m
                    </div>
                  </Card>

                  {/* Available */}
                  <Card className="p-3 bg-emerald-50/60 border-emerald-300">
                    <div className="text-[10px] uppercase font-semibold text-emerald-800 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Available
                    </div>
                    <div className="text-lg font-bold text-emerald-700 mt-1">
                      {validation.allocation.availableMinutes}m
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Timeline View */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight">
                  Day {currentDay.day_number} Timeline & Discrete Time Blocks
                </h3>
                <Badge variant="outline" className="text-xs">
                  {currentDay.items.length} Planned Stop(s)
                </Badge>
              </div>

              {currentDay.items.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <p className="text-sm text-muted-foreground mb-4">
                    No itinerary stops planned for this day yet.
                  </p>
                  <Button size="sm" onClick={() => setShowAddModal(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" /> Add First Stop
                  </Button>
                </Card>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-muted-foreground/20">
                  {currentDay.items.map((item, idx) => (
                    <div key={item.id} className="relative space-y-3">
                      {/* Transit Indicator connector if item has travel time */}
                      {item.travel_minutes > 0 && idx > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg border border-dashed ml-3">
                          <Car className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            <strong>{item.travel_minutes} mins</strong> transit from previous location
                          </span>
                        </div>
                      )}

                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 border-background bg-primary" />

                      {/* Activity Card */}
                      <Card className="shadow-sm hover:border-primary/40 transition-colors">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="font-mono text-xs">
                                {item.start_time} - {item.end_time}
                              </Badge>
                              <Badge className={`text-xs capitalize ${getCategoryColor(item.category)}`}>
                                <span className="mr-1">{getCategoryIcon(item.category)}</span>
                                {item.category}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                Tier: {item.duration_tier}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {item.priority.replace("_", " ")}
                              </Badge>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-muted-foreground hover:text-rose-600 h-7 w-7 p-0 sm:self-auto self-end"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <CardTitle className="text-base font-bold mt-2">
                            {item.title}
                          </CardTitle>
                          <CardDescription className="text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary" />
                            {item.location.name}
                          </CardDescription>
                        </CardHeader>

                        {/* Discrete Time Blocks (Strictly Kept Separate) */}
                        <CardContent className="p-4 pt-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs">
                            <div className="bg-muted/40 p-2 rounded">
                              <span className="text-muted-foreground block text-[10px]">Visit Time</span>
                              <strong className="text-foreground">{item.visit_minutes} mins</strong>
                            </div>

                            <div className="bg-muted/40 p-2 rounded">
                              <span className="text-muted-foreground block text-[10px]">Travel Time</span>
                              <strong className="text-foreground">{item.travel_minutes} mins</strong>
                            </div>

                            <div className="bg-muted/40 p-2 rounded">
                              <span className="text-muted-foreground block text-[10px]">Waiting / Queue</span>
                              <strong className="text-foreground">{item.waiting_minutes} mins</strong>
                            </div>

                            <div className="bg-muted/40 p-2 rounded">
                              <span className="text-muted-foreground block text-[10px]">Contingency Buffer</span>
                              <strong className="text-foreground">{item.buffer_minutes} mins</strong>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Modal: Add Itinerary Stop */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-2xl border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Add Itinerary Block to Day {selectedDayNumber}
                </CardTitle>
                <CardDescription className="text-xs">
                  Create a new visit, meal, transit, or rest activity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      placeholder="e.g. Amber Palace Mirror Hall"
                      value={addTitle}
                      onChange={(e) => setAddTitle(e.target.value)}
                      className="text-xs h-9"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Category</Label>
                      <select
                        value={addCategory}
                        onChange={(e) => setAddCategory(e.target.value as ItineraryItemCategory)}
                        className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
                      >
                        <option value="sightseeing">Sightseeing</option>
                        <option value="food">Meal / Dining</option>
                        <option value="rest">Rest / Downtime</option>
                        <option value="activity">Recreation Activity</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Duration Tier</Label>
                      <select
                        value={addDurationTier}
                        onChange={(e) => setAddDurationTier(e.target.value as DurationTier)}
                        className="w-full text-xs h-9 rounded-md border border-input bg-background px-3"
                      >
                        <option value="Normal">Normal Visit</option>
                        <option value="Quick">Quick / Express</option>
                        <option value="Relaxed">Relaxed / In-Depth</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Location Name</Label>
                    <Input
                      placeholder="e.g. Amber Fort, Devisinghpura"
                      value={addLocationName}
                      onChange={(e) => setAddLocationName(e.target.value)}
                      className="text-xs h-9"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Start Time</Label>
                      <Input
                        type="time"
                        value={addStartTime}
                        onChange={(e) => setAddStartTime(e.target.value)}
                        className="text-xs h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">End Time</Label>
                      <Input
                        type="time"
                        value={addEndTime}
                        onChange={(e) => setAddEndTime(e.target.value)}
                        className="text-xs h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Visit (min)</Label>
                      <Input
                        type="number"
                        min="15"
                        value={addVisitMinutes}
                        onChange={(e) => setAddVisitMinutes(Number(e.target.value))}
                        className="text-xs h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Travel (min)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={addTravelMinutes}
                        onChange={(e) => setAddTravelMinutes(Number(e.target.value))}
                        className="text-xs h-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddModal(false)}
                      className="text-xs h-9"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={submittingItem}
                      className="text-xs h-9"
                    >
                      {submittingItem ? "Adding..." : "Add to Itinerary"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Re-plan My Day Modal */}
        <ReplanModal
          isOpen={showReplanModal}
          onClose={() => setShowReplanModal(false)}
          tripId={tripId}
          dayNumber={selectedDayNumber}
          dayDate={currentDay?.date || new Date().toISOString().substring(0, 10)}
          onApplied={async () => {
            await loadDay(selectedDayNumber);
            await loadAllDays();
          }}
        />
      </main>
    </div>
  );
}
