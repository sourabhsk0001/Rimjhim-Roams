"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Compass,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
  Wallet,
  CheckCircle2,
  Bed,
  Utensils,
  Car,
  Ticket,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  Navigation as NavIcon,
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
import { InteractiveMap, MapMarkerItem } from "@/components/map/interactive-map";
import { TripRow } from "@/lib/services/trip-service";
import { PlannedTripResult } from "@/types/planner";

const PLANNING_STAGES = [
  { id: "finding_places", label: "Finding places", desc: "Discovering curated destination sights and culture" },
  { id: "finding_hotel", label: "Finding hotel", desc: "Evaluating accommodation matching your party and budget" },
  { id: "calculating_transport", label: "Calculating transport", desc: "Selecting intercity connections and local transit" },
  { id: "optimizing_route", label: "Optimizing route", desc: "Clustering waypoints and validating physically possible travel times" },
  { id: "calculating_budget", label: "Calculating budget", desc: "Applying deterministic minor-unit arithmetic across 8 categories" },
  { id: "building_itinerary", label: "Building itinerary", desc: "Assembling discrete unmerged time blocks with meals and buffers" },
];

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<TripRow | null>(null);
  const [plan, setPlan] = useState<PlannedTripResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Selected Day tab in itinerary view
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);

  // Load trip and check for existing plan
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const tripRes = await fetch(`/api/trips/${tripId}`);
        const tripData = await tripRes.json();
        if (!tripRes.ok) {
          throw new Error(tripData.error || "Failed to load trip details.");
        }
        setTrip(tripData.trip);

        // Check for existing plan
        const planRes = await fetch(`/api/trips/${tripId}/plan`);
        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData.plan) {
            setPlan(planData.plan);
          }
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading trip details."
        );
      } finally {
        setLoading(false);
      }
    }

    if (tripId) {
      loadData();
    }
  }, [tripId]);

  // Handle "Generate My Complete Trip"
  const handleGenerateTrip = async () => {
    setIsGenerating(true);
    setCurrentStepIndex(0);
    setError(null);

    // Step simulation intervals for UI progress display
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < PLANNING_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const res = await fetch(`/api/trips/${tripId}/plan`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.plan) {
        throw new Error(data.error || "Failed to generate complete trip plan.");
      }

      clearInterval(stepInterval);
      setCurrentStepIndex(PLANNING_STAGES.length);
      setPlan(data.plan);
      setSelectedDayNumber(1);
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setError(
        err instanceof Error ? err.message : "Error generating trip plan."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trip itinerary?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete trip.");
      }
      router.push("/trips");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting trip.");
      setDeleting(false);
    }
  };

  // Convert planned entities into interactive map markers
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    if (!plan) return [];
    const list: MapMarkerItem[] = [];

    // 1. Destination Center
    list.push({
      id: `dest-${plan.destination.id}`,
      name: plan.destination.name,
      latitude: plan.destination.latitude,
      longitude: plan.destination.longitude,
      type: "destination",
      details: {
        category: plan.destination.state_province,
      },
    });

    // 2. Hotel
    if (plan.hotel?.selected) {
      list.push({
        id: `hotel-${plan.hotel.selected.id}`,
        name: plan.hotel.selected.name,
        latitude: plan.hotel.selected.latitude,
        longitude: plan.hotel.selected.longitude,
        type: "hotel",
        details: {
          price: `₹${plan.hotel.selected.price_per_night}/night`,
          rating: plan.hotel.selected.rating,
        },
      });
    }

    // 3. Attractions
    plan.attractions.forEach((a) => {
      list.push({
        id: `attr-${a.attraction.id}`,
        name: a.attraction.name,
        latitude: a.attraction.latitude,
        longitude: a.attraction.longitude,
        type: "attraction",
        details: {
          category: a.attraction.category,
          price: a.attraction.ticket_price === 0 ? "Free" : `₹${a.attraction.ticket_price}`,
          hours: `${a.attraction.opening_time} - ${a.attraction.closing_time}`,
        },
      });
    });

    // 4. Restaurants
    plan.food.meals.forEach((m) => {
      list.push({
        id: `rest-${m.restaurant.id}`,
        name: m.restaurant.name,
        latitude: m.restaurant.latitude,
        longitude: m.restaurant.longitude,
        type: "restaurant",
        details: {
          cuisine: m.restaurant.cuisine,
          price: m.restaurant.price_level,
        },
      });
    });

    return list;
  }, [plan]);

  // Active day plan
  const activeDay = useMemo(() => {
    if (!plan || !plan.itinerary) return null;
    return (
      plan.itinerary.find((d) => d.dayNumber === selectedDayNumber) ||
      plan.itinerary[0] ||
      null
    );
  }, [plan, selectedDayNumber]);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Top Bar Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
            <Link href="/trips">
              <ArrowLeft className="w-4 h-4" /> Back to My Trips
            </Link>
          </Button>

          {trip && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={handleGenerateTrip}
                disabled={isGenerating}
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md font-semibold"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                {plan ? "Regenerate Complete Trip" : "Generate My Complete Trip"}
              </Button>

              <Button size="sm" asChild variant="outline" className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50">
                <Link href={`/trips/${trip.id}/itinerary`}>
                  <Clock className="w-4 h-4" />
                  Time & Itinerary
                </Link>
              </Button>

              <Button size="sm" asChild className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href={`/trips/${trip.id}/budget`}>
                  <Wallet className="w-4 h-4" />
                  Budget & Ledger
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Trip
              </Button>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading trip information...</p>
          </div>
        ) : !trip ? (
          <Card className="p-12 text-center border-dashed">
            <p className="text-muted-foreground">Trip not found or unauthorized.</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Live Progress Card when Generating */}
            {isGenerating && (
              <Card className="border-blue-200 bg-blue-50/50 shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-blue-950">
                        TripWise Planning Engine Active
                      </CardTitle>
                      <CardDescription className="text-xs text-blue-700">
                        Connecting catalog, routing, time intelligence, and budget engines...
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {PLANNING_STAGES.map((st, idx) => {
                      const isDone = idx < currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      return (
                        <div
                          key={st.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border text-sm transition-all ${
                            isCurrent
                              ? "bg-white border-blue-400 shadow-sm"
                              : isDone
                              ? "bg-white/60 border-blue-200 text-muted-foreground"
                              : "border-transparent opacity-50"
                          }`}
                        >
                          <div className="mt-0.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : isCurrent ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{st.label}</p>
                            <p className="text-xs text-muted-foreground">{st.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 1. Trip Overview Card */}
            <Card className="overflow-hidden shadow-lg border-muted">
              <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none uppercase tracking-wider text-xs">
                        {plan ? "Complete Plan Ready" : trip.status}
                      </Badge>
                      <Badge className="bg-emerald-500/20 text-emerald-200 border-none text-xs">
                        Deterministic Intelligence
                      </Badge>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      {trip.origin} → {plan ? plan.destination.name : trip.destination}
                    </h1>

                    <p className="text-blue-100 flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-amber-300" />
                      <span>
                        {plan ? `${plan.destination.name}, ${plan.destination.state_province}, ${plan.destination.country}` : trip.destination}
                      </span>
                      {plan?.destination.climate && (
                        <>
                          <span>•</span>
                          <span>{plan.destination.climate}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-right min-w-[180px]">
                    <span className="text-xs text-blue-200 uppercase tracking-wider">
                      {plan ? "Total Plan Cost" : "Budget Cap"}
                    </span>
                    <div className="text-3xl font-extrabold text-white">
                      ₹{(plan ? plan.budget.totalCost : trip.budget).toLocaleString()}
                    </div>
                    {plan && (
                      <div className="text-xs text-emerald-300 mt-1 flex items-center justify-end gap-1 font-medium">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>₹{plan.budget.remainingBudget.toLocaleString()} Surplus</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Highlights Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
                  <div className="space-y-0.5">
                    <span className="text-xs text-blue-200 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Dates
                    </span>
                    <p className="text-sm font-semibold">{trip.start_date} to {trip.end_date}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-blue-200 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Duration
                    </span>
                    <p className="text-sm font-semibold">{trip.duration_days} Days ({Math.max(1, trip.duration_days - 1)} Nights)</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-blue-200 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Travellers
                    </span>
                    <p className="text-sm font-semibold capitalize">{trip.traveller_count} ({trip.traveller_type})</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs text-blue-200 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" /> Pace
                    </span>
                    <p className="text-sm font-semibold capitalize">{trip.travel_pace} Pace</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* If Plan is Not Generated Yet, Show Prompt CTA */}
            {!plan && !isGenerating && (
              <Card className="p-8 text-center border-dashed bg-card space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-xl font-bold">Generate Your Complete Itinerary</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect verified attractions, hotels, dining, intercity routing, and budget arithmetic into a verified, conflict-free travel operating plan.
                  </p>
                </div>
                <Button
                  onClick={handleGenerateTrip}
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow font-semibold"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Generate My Complete Trip
                </Button>
              </Card>
            )}

            {/* When Plan is Present: Render Complete 7-Section Architecture */}
            {plan && (
              <div className="space-y-8">
                {/* 2. Interactive Map Section */}
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg font-bold">Interactive Route & Destination Map</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        OpenStreetMap & OSRM
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Explore hotel base, curated attractions, and local dining stops on Leaflet canvas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <InteractiveMap
                      center={[plan.destination.latitude, plan.destination.longitude]}
                      zoom={12}
                      markers={mapMarkers}
                      routeCoordinates={activeDay?.routeCoordinates || []}
                      height="460px"
                    />
                  </CardContent>
                </Card>

                {/* 3. Day-by-Day Itinerary Section */}
                <Card className="shadow-md">
                  <CardHeader className="border-b pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-600" />
                          <CardTitle className="text-xl font-bold">Day-by-Day Schedule</CardTitle>
                        </div>
                        <CardDescription className="text-xs mt-1">
                          Discrete unmerged visit, travel, waiting, and buffer time blocks.
                        </CardDescription>
                      </div>

                      {/* Day Selector Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {plan.itinerary.map((d) => (
                          <Button
                            key={d.dayNumber}
                            size="sm"
                            variant={d.dayNumber === selectedDayNumber ? "default" : "outline"}
                            onClick={() => setSelectedDayNumber(d.dayNumber)}
                            className="text-xs"
                          >
                            Day {d.dayNumber}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    {activeDay && (
                      <div className="space-y-6">
                        {/* Day Header Info */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 rounded-xl border text-sm">
                          <div>
                            <span className="font-bold text-foreground">Day {activeDay.dayNumber}: {activeDay.theme}</span>
                            <span className="text-muted-foreground text-xs block">{activeDay.date} • {activeDay.dayStartTime} to {activeDay.dayEndTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600/10 text-emerald-700 border-emerald-300 gap-1 text-xs">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Schedule Validated
                            </Badge>
                            <Button size="sm" variant="ghost" asChild className="text-xs gap-1 text-purple-600 hover:text-purple-700">
                              <Link href={`/trips/${trip.id}/itinerary`}>
                                Optimize Day <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {/* Discrete Time Metrics Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-lg border bg-blue-50/50 border-blue-200">
                            <span className="text-muted-foreground block">Sightseeing Time</span>
                            <span className="font-bold text-sm text-blue-900">{activeDay.totalVisitMinutes} min</span>
                          </div>
                          <div className="p-3 rounded-lg border bg-amber-50/50 border-amber-200">
                            <span className="text-muted-foreground block">Travel / Transit</span>
                            <span className="font-bold text-sm text-amber-900">{activeDay.totalTravelMinutes} min</span>
                          </div>
                          <div className="p-3 rounded-lg border bg-rose-50/50 border-rose-200">
                            <span className="text-muted-foreground block">Queue Waiting</span>
                            <span className="font-bold text-sm text-rose-900">{activeDay.totalWaitingMinutes} min</span>
                          </div>
                          <div className="p-3 rounded-lg border bg-emerald-50/50 border-emerald-200">
                            <span className="text-muted-foreground block">Contingency Buffer</span>
                            <span className="font-bold text-sm text-emerald-900">{activeDay.totalBufferMinutes} min</span>
                          </div>
                        </div>

                        {/* Timeline of Items */}
                        <div className="space-y-3 relative pl-6 border-l-2 border-muted ml-3">
                          {activeDay.items.map((item, idx) => {
                            const isMeal = item.category === "food";
                            return (
                              <div key={item.id || idx} className="relative group">
                                {/* Dot indicator */}
                                <div className={`absolute -left-[31px] top-3 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                                  isMeal ? "border-rose-500 text-rose-500" : "border-blue-600 text-blue-600"
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${isMeal ? "bg-rose-500" : "bg-blue-600"}`} />
                                </div>

                                <Card className="p-4 border hover:border-primary/40 transition-colors">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <Badge variant={isMeal ? "secondary" : "default"} className="text-xs">
                                          {item.start_time} - {item.end_time}
                                        </Badge>
                                        <span className="font-semibold text-sm">{item.title}</span>
                                      </div>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-primary" />
                                        <span>{item.location.name}</span>
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <span className="font-bold text-xs text-foreground">
                                        {item.estimated_cost === 0 ? "Free" : `₹${item.estimated_cost.toLocaleString()}`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Discrete breakdown badges */}
                                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t text-[11px] text-muted-foreground">
                                    <span className="bg-muted px-2 py-0.5 rounded">
                                      Visit: {item.visit_minutes}m
                                    </span>
                                    {item.travel_minutes > 0 && (
                                      <span className="bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded">
                                        Transit: {item.travel_minutes}m
                                      </span>
                                    )}
                                    {item.waiting_minutes > 0 && (
                                      <span className="bg-rose-100/70 text-rose-900 px-2 py-0.5 rounded">
                                        Queue: {item.waiting_minutes}m
                                      </span>
                                    )}
                                    {item.buffer_minutes > 0 && (
                                      <span className="bg-emerald-100/70 text-emerald-900 px-2 py-0.5 rounded">
                                        Buffer: {item.buffer_minutes}m
                                      </span>
                                    )}
                                    {item.opening_time && item.closing_time && (
                                      <span className="text-muted-foreground italic ml-auto">
                                        Hours: {item.opening_time} - {item.closing_time}
                                      </span>
                                    )}
                                  </div>
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4. Budget Section */}
                <Card className="shadow-md">
                  <CardHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                        <CardTitle className="text-lg font-bold">Deterministic Budget Allocation</CardTitle>
                      </div>
                      <Button size="sm" variant="outline" asChild className="text-xs">
                        <Link href={`/trips/${trip.id}/budget`}>
                          Open Expense Ledger <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Budget Overview Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Allocated Budget: ₹{plan.budget.allocatedBudget.toLocaleString()}</span>
                        <span className="font-bold text-foreground">Total: ₹{plan.budget.totalCost.toLocaleString()} ({Math.round((plan.budget.totalCost / plan.budget.allocatedBudget) * 100)}%)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
                        <div
                          className="bg-blue-600 h-full"
                          style={{ width: `${plan.budget.categories.transport?.percentage || 25}%` }}
                          title="Transport"
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{ width: `${plan.budget.categories.hotel?.percentage || 30}%` }}
                          title="Hotel"
                        />
                        <div
                          className="bg-rose-500 h-full"
                          style={{ width: `${plan.budget.categories.food?.percentage || 20}%` }}
                          title="Food"
                        />
                        <div
                          className="bg-purple-500 h-full"
                          style={{ width: `${plan.budget.categories.activities?.percentage || 15}%` }}
                          title="Activities"
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${plan.budget.categories.emergency_buffer?.percentage || 5}%` }}
                          title="Emergency Buffer"
                        />
                      </div>
                    </div>

                    {/* 8 Categories Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(plan.budget.categories).map(([cat, val]) => (
                        <div key={cat} className="p-3 rounded-xl border bg-card space-y-1">
                          <span className="text-xs text-muted-foreground capitalize">
                            {cat.replace("_", " ")}
                          </span>
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-sm text-foreground">{val.formatted}</span>
                            <span className="text-xs text-muted-foreground">{val.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {plan.optimization.wasOptimized && (
                      <Alert className="bg-amber-50 border-amber-300 text-amber-900">
                        <TrendingDown className="w-4 h-4 text-amber-700" />
                        <AlertTitle className="text-xs font-bold uppercase">Budget Optimizer Applied</AlertTitle>
                        <AlertDescription className="text-xs">
                          {plan.optimization.appliedAdjustments.join(" ")}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* 5. Selected Hotel & 6. Transport Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Selected Hotel */}
                  <Card className="shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Bed className="w-5 h-5 text-amber-600" />
                        <CardTitle className="text-base font-bold">Selected Lodging</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-xl border bg-amber-50/40 border-amber-200 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{plan.hotel.selected.name}</h4>
                            <p className="text-xs text-muted-foreground">{plan.destination.name}, {plan.destination.state_province}</p>
                          </div>
                          <Badge className="bg-amber-600 text-white text-xs">
                            ★ {plan.hotel.selected.rating}
                          </Badge>
                        </div>

                        <div className="flex justify-between text-xs pt-2 border-t border-amber-200">
                          <span className="text-muted-foreground">Price per night:</span>
                          <span className="font-semibold">₹{plan.hotel.selected.price_per_night.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Rooms & Nights:</span>
                          <span className="font-semibold">{plan.hotel.roomCount} Room(s) × {plan.hotel.nights} Night(s)</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-amber-900 pt-1">
                          <span>Total Lodging Cost:</span>
                          <span>{plan.hotel.totalCostFormatted}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {plan.hotel.selected.amenities.map((am) => (
                          <Badge key={am} variant="outline" className="text-[11px] bg-muted/40">
                            {am}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transport */}
                  <Card className="shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-base font-bold">Transit & Local Mobility</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-xl border bg-blue-50/40 border-blue-200 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">
                              {"provider" in plan.transport.outbound
                                ? plan.transport.outbound.provider
                                : plan.transport.outbound.name || "Intercity Transit"}
                            </h4>
                            <p className="text-xs text-muted-foreground capitalize">
                              {"mode" in plan.transport.outbound
                                ? plan.transport.outbound.mode
                                : plan.transport.outbound.vehicle_type || "Road / Air"} • {plan.origin} ↔ {plan.destination.name}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs border-blue-300 text-blue-800">
                            Round-Trip
                          </Badge>
                        </div>

                        <div className="flex justify-between text-xs pt-2 border-t border-blue-200">
                          <span className="text-muted-foreground">Intercity Fare:</span>
                          <span className="font-semibold">₹{plan.transport.intercityCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Local Transit:</span>
                          <span className="font-semibold">{plan.transport.localTransitMode} (₹{plan.transport.localCost.toLocaleString()})</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-blue-900 pt-1">
                          <span>Total Mobility Cost:</span>
                          <span>{plan.transport.totalCostFormatted}</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground italic">
                        Includes estimated airport/station transfers and daily intra-city sightseeing routes.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 7. Dining & Food Section */}
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-rose-600" />
                      <CardTitle className="text-base font-bold">Curated Dining Schedule</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {plan.food.meals.map((meal, idx) => (
                        <div key={idx} className="p-3 rounded-xl border bg-card space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-rose-700 border-rose-300">
                              Day {meal.dayNumber} {meal.mealType}
                            </Badge>
                            <span className="font-semibold">{meal.restaurant.price_level}</span>
                          </div>
                          <p className="font-bold text-sm text-foreground">{meal.restaurant.name}</p>
                          <p className="text-muted-foreground">{meal.restaurant.cuisine}</p>
                          <div className="flex justify-between text-[11px] pt-1 text-muted-foreground">
                            <span>Est. Cost:</span>
                            <span className="font-semibold text-foreground">₹{meal.estimatedCost.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 8. Selected Attractions Section */}
                <Card className="shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-emerald-600" />
                      <CardTitle className="text-base font-bold">Selected Attractions & Heritage Sites</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {plan.attractions.map((a, idx) => (
                        <div key={idx} className="p-3 rounded-xl border bg-card space-y-2 text-xs">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-sm text-foreground">{a.attraction.name}</h4>
                            <Badge variant="secondary" className="text-[10px]">
                              Day {a.dayNumber}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">{a.attraction.description}</p>
                          <div className="pt-2 border-t flex flex-wrap justify-between gap-1 text-[11px] text-muted-foreground">
                            <span>Visit: {a.visitMinutes}m</span>
                            <span>Queue: {a.queueMinutes}m</span>
                            <span className="font-semibold text-foreground">
                              {a.ticketPrice === 0 ? "Free" : `₹${a.ticketPrice}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
