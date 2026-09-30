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
  CloudSun,
  Bot,
  Vote,
  Scale,
  ShieldAlert,
  Luggage,
  FileText,
  CalendarCheck,
  Coffee,
  Shield,
  Receipt,
  Calculator,
  AlertTriangle,
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
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
import { ConfirmationModal } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { TripHeaderSkeleton, TimelineSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
  const { toast } = useToast();

  const [trip, setTrip] = useState<TripRow | null>(null);
  const [plan, setPlan] = useState<PlannedTripResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Selected Day tab & interactive item highlight
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
      toast({
        title: "Complete Trip Plan Generated!",
        description: `Verified itinerary created for ${data.plan.destination.name} within budget.`,
        type: "success",
      });
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setError(
        err instanceof Error ? err.message : "Error generating trip plan."
      );
      toast({
        title: "Generation Failed",
        description: err instanceof Error ? err.message : "Error generating trip plan.",
        type: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmDeleteTrip = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete trip.");
      }
      toast({
        title: "Trip Deleted",
        description: "The trip itinerary has been permanently removed.",
        type: "info",
      });
      router.push("/trips");
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Deletion Failed",
        description: err instanceof Error ? err.message : "Error deleting trip.",
        type: "error",
      });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Active day plan
  const activeDay = useMemo(() => {
    if (!plan || !plan.itinerary) return null;
    return (
      plan.itinerary.find((d) => d.dayNumber === selectedDayNumber) ||
      plan.itinerary[0] ||
      null
    );
  }, [plan, selectedDayNumber]);

  // Convert planned entities into interactive map markers with numbered order for activeDay
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
      const isSelected = selectedItemId === `hotel-${plan.hotel.selected.id}`;
      list.push({
        id: `hotel-${plan.hotel.selected.id}`,
        name: plan.hotel.selected.name,
        latitude: plan.hotel.selected.latitude,
        longitude: plan.hotel.selected.longitude,
        type: "hotel",
        isSelected,
        details: {
          price: `₹${plan.hotel.selected.price_per_night}/night`,
          rating: plan.hotel.selected.rating,
        },
      });
    }

    // 3. Attractions
    plan.attractions.forEach((a) => {
      const dayIndex = activeDay?.items?.findIndex(
        (it) => it.attraction_id === a.attraction.id || it.title.toLowerCase() === a.attraction.name.toLowerCase()
      );
      const isSelected =
        selectedItemId === `attr-${a.attraction.id}` ||
        (dayIndex !== undefined && dayIndex !== -1 && activeDay?.items[dayIndex]?.id === selectedItemId);

      list.push({
        id: `attr-${a.attraction.id}`,
        name: a.attraction.name,
        latitude: a.attraction.latitude,
        longitude: a.attraction.longitude,
        type: "attraction",
        order: dayIndex !== undefined && dayIndex !== -1 ? dayIndex + 1 : undefined,
        isSelected,
        details: {
          category: a.attraction.category,
          price: a.attraction.ticket_price === 0 ? "Free" : `₹${a.attraction.ticket_price}`,
          hours: `${a.attraction.opening_time} - ${a.attraction.closing_time}`,
        },
      });
    });

    // 4. Restaurants
    plan.food.meals.forEach((m) => {
      const dayIndex = activeDay?.items?.findIndex(
        (it) => it.title.toLowerCase().includes(m.restaurant.name.toLowerCase())
      );
      const isSelected =
        selectedItemId === `rest-${m.restaurant.id}` ||
        (dayIndex !== undefined && dayIndex !== -1 && activeDay?.items[dayIndex]?.id === selectedItemId);

      list.push({
        id: `rest-${m.restaurant.id}`,
        name: m.restaurant.name,
        latitude: m.restaurant.latitude,
        longitude: m.restaurant.longitude,
        type: "restaurant",
        order: dayIndex !== undefined && dayIndex !== -1 ? dayIndex + 1 : undefined,
        isSelected,
        details: {
          cuisine: m.restaurant.cuisine,
          price: m.restaurant.price_level,
        },
      });
    });

    return list;
  }, [plan, activeDay, selectedItemId]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6 animate-fade-rise">
        {/* Top Back & Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/trips"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(215,25%,32%)] hover:text-[#0f172a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Trips
          </Link>

          {trip && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleGenerateTrip}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black text-white text-xs sm:text-sm font-medium shadow-xs hover:scale-[1.03] active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                {plan ? "Regenerate Plan" : "Generate Complete Trip"}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-200 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 hover:scale-[1.03] transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-6">
            <TripHeaderSkeleton />
            <TimelineSkeleton />
          </div>
        ) : !trip ? (
          <EmptyState
            title="Trip Not Found"
            description="The requested trip itinerary does not exist or you do not have permission to view it."
            action={{
              label: "Return to My Trips",
              href: "/trips",
              icon: <ArrowLeft className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Live Progress Card when Generating */}
            {isGenerating && (
              <Card className="border-blue-200 bg-blue-50/50 shadow-md rounded-3xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center animate-pulse shadow-md">
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
                          className={`flex items-start gap-3 p-3 rounded-xl border text-sm transition-all ${
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

            {/* 1. Trip Hero Header with Strong Visual Hierarchy */}
            <div className="overflow-hidden shadow-sm border border-slate-200/80 rounded-3xl bg-gradient-to-br from-[#071324] via-[#0f172a] to-[#1e293b] text-white p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-white/10 text-white uppercase tracking-wider text-[10px] font-semibold px-3 py-1 rounded-full border border-white/15">
                      {plan ? "Complete Plan Ready" : trip.status}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-medium px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" /> Deterministic Engine
                    </span>
                  </div>

                  <h1 className="font-instrument text-4xl sm:text-6xl font-normal tracking-[-1.5px] leading-tight text-white">
                    {trip.origin} → {plan ? plan.destination.name : trip.destination}
                  </h1>

                  <p className="text-slate-300 flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {plan ? `${plan.destination.name}, ${plan.destination.state_province}, ${plan.destination.country}` : trip.destination}
                    </span>
                    {plan?.destination.climate && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-slate-200">{plan.destination.climate}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Financial Status Box */}
                <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-right min-w-[200px]">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
                    {plan ? "Total Plan Cost" : "Budget Cap"}
                  </span>
                  <div className="font-instrument text-4xl sm:text-5xl font-normal text-white tracking-tight mt-1">
                    ₹{(plan ? plan.budget.totalCost : trip.budget).toLocaleString()}
                  </div>
                  {plan && (
                    <div className="text-xs mt-1.5 flex items-center justify-end gap-1 font-medium">
                      {plan.budget.isOverBudget ? (
                        <span className="text-rose-300 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          ₹{(plan.budget.totalCost - plan.budget.allocatedBudget).toLocaleString()} Over Budget
                        </span>
                      ) : (
                        <span className="text-emerald-300 flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          ₹{plan.budget.remainingBudget.toLocaleString()} Surplus
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Key Trip Parameters Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
                <div className="space-y-1">
                  <span className="text-xs text-blue-200 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Dates
                  </span>
                  <p className="text-sm font-semibold">{trip.start_date} to {trip.end_date}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-blue-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Duration
                  </span>
                  <p className="text-sm font-semibold">{trip.duration_days} Days ({Math.max(1, trip.duration_days - 1)} Nights)</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-blue-200 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Party
                  </span>
                  <p className="text-sm font-semibold capitalize">{trip.traveller_count} ({trip.traveller_type})</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-blue-200 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5" /> Travel Pace
                  </span>
                  <p className="text-sm font-semibold capitalize">{trip.travel_pace} Pace</p>
                </div>
              </div>
            </div>

            {/* Segmented Module Navigation Bar */}
            <TripWorkspaceNav tripId={trip.id} />

            {/* If Plan is Not Generated Yet, Show CTA Empty State */}
            {!plan && !isGenerating && (
              <EmptyState
                icon={<Sparkles className="w-8 h-8 text-primary" />}
                title="Generate Your Complete Travel Operating Plan"
                description="Connect verified attractions, hotels, dining, intercity routing, and budget arithmetic into a verified, conflict-free travel operating plan."
                action={{
                  label: "Generate My Complete Trip",
                  onClick: handleGenerateTrip,
                  icon: <Sparkles className="w-4 h-4 text-amber-300" />,
                }}
              />
            )}

            {/* When Plan is Present: Render Complete Architecture */}
            {plan && (
              <div className="space-y-8">
                {/* 2. Interactive Map Section */}
                <Card className="shadow-md rounded-3xl overflow-hidden">
                  <CardHeader className="pb-3 border-b bg-card/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <div>
                          <CardTitle className="text-base sm:text-lg font-bold">
                            Interactive Route & Destination Map
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Day {selectedDayNumber} stops numbered #1, #2, #3 matching your schedule.
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
                        OSM & OSRM
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <InteractiveMap
                      center={[plan.destination.latitude, plan.destination.longitude]}
                      zoom={12}
                      markers={mapMarkers}
                      routeCoordinates={activeDay?.routeCoordinates || []}
                      onMarkerSelect={(m) => setSelectedItemId(m.id)}
                      height="460px"
                    />
                  </CardContent>
                </Card>

                {/* 3. Day-by-Day Itinerary Section */}
                <Card className="shadow-md rounded-3xl">
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
                            onClick={() => {
                              setSelectedDayNumber(d.dayNumber);
                              setSelectedItemId(null);
                            }}
                            className="text-xs rounded-xl"
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
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-muted/40 rounded-2xl border text-sm">
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
                          <div className="p-3 rounded-2xl border bg-emerald-50/50 border-emerald-200">
                            <span className="text-muted-foreground block text-[11px] font-medium">Activity / Sights</span>
                            <span className="font-bold text-sm text-emerald-900">{activeDay.totalVisitMinutes} min</span>
                          </div>
                          <div className="p-3 rounded-2xl border bg-indigo-50/50 border-indigo-200">
                            <span className="text-muted-foreground block text-[11px] font-medium">Travel / Transit</span>
                            <span className="font-bold text-sm text-indigo-900">{activeDay.totalTravelMinutes} min</span>
                          </div>
                          <div className="p-3 rounded-2xl border bg-amber-50/50 border-amber-200">
                            <span className="text-muted-foreground block text-[11px] font-medium">Queue Waiting</span>
                            <span className="font-bold text-sm text-amber-900">{activeDay.totalWaitingMinutes} min</span>
                          </div>
                          <div className="p-3 rounded-2xl border bg-slate-100/70 border-slate-300">
                            <span className="text-muted-foreground block text-[11px] font-medium">Contingency Buffer</span>
                            <span className="font-bold text-sm text-slate-800">{activeDay.totalBufferMinutes} min</span>
                          </div>
                        </div>

                        {/* Timeline of Items with Distinct Styles */}
                        <div className="space-y-4 relative pl-6 border-l-2 border-muted ml-3">
                          {activeDay.items.map((item, idx) => {
                            const isMeal = item.category === "food";
                            const isTravel = item.category === "travel";
                            const isRest = item.category === "rest";
                            const isActivity = !isMeal && !isTravel && !isRest;
                            const hasBuffer = item.buffer_minutes > 0;
                            const isSelected = selectedItemId === item.id;

                            // Theme palette for the 5 distinct categories
                            let borderTheme = "border-l-4 border-l-emerald-500 bg-emerald-50/20";
                            let badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-200";
                            let CategoryIcon = Ticket;
                            let categoryLabel = "Activity";
                            let dotColor = "border-emerald-600 text-emerald-600 bg-emerald-600";

                            if (isTravel) {
                              borderTheme = "border-l-4 border-l-indigo-500 bg-indigo-50/20";
                              badgeStyle = "bg-indigo-100 text-indigo-800 border-indigo-200";
                              CategoryIcon = Car;
                              categoryLabel = "Travel";
                              dotColor = "border-indigo-600 text-indigo-600 bg-indigo-600";
                            } else if (isMeal) {
                              borderTheme = "border-l-4 border-l-amber-500 bg-amber-50/20";
                              badgeStyle = "bg-amber-100 text-amber-800 border-amber-200";
                              CategoryIcon = Utensils;
                              categoryLabel = "Food";
                              dotColor = "border-amber-600 text-amber-600 bg-amber-600";
                            } else if (isRest) {
                              borderTheme = "border-l-4 border-l-purple-500 bg-purple-50/20";
                              badgeStyle = "bg-purple-100 text-purple-800 border-purple-200";
                              CategoryIcon = Coffee;
                              categoryLabel = "Rest";
                              dotColor = "border-purple-600 text-purple-600 bg-purple-600";
                            }

                            return (
                              <div
                                key={item.id || idx}
                                className="relative group cursor-pointer"
                                onClick={() => setSelectedItemId(item.id)}
                              >
                                {/* Dot indicator matching stop number */}
                                <div className={`absolute -left-[35px] top-4 w-6 h-6 rounded-full border-2 bg-background flex items-center justify-center font-bold text-[10px] shadow-sm transition-all ${
                                  isSelected ? "scale-125 ring-2 ring-primary" : ""
                                }`}>
                                  <span className="leading-none text-foreground">{idx + 1}</span>
                                </div>

                                <Card
                                  className={`p-4 rounded-2xl transition-all shadow-sm ${borderTheme} ${
                                    isSelected
                                      ? "ring-2 ring-primary shadow-md border-primary/50"
                                      : "hover:border-primary/40 hover:shadow"
                                  }`}
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="space-y-1.5">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="text-xs font-mono">
                                          {item.start_time} - {item.end_time}
                                        </Badge>
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badgeStyle}`}>
                                          <CategoryIcon className="w-3 h-3" />
                                          {categoryLabel}
                                        </span>
                                        {hasBuffer && (
                                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 flex items-center gap-1">
                                            <Shield className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                                            +{item.buffer_minutes}m Buffer
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="font-bold text-base text-foreground leading-snug">
                                        {item.title}
                                      </h4>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                        <span>{item.location.name}</span>
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <span className="font-bold text-sm text-foreground">
                                        {item.estimated_cost === 0 ? "Free" : `₹${item.estimated_cost.toLocaleString()}`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Discrete breakdown badges */}
                                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t text-[11px] text-muted-foreground">
                                    <span className="bg-muted px-2 py-0.5 rounded-lg">
                                      Visit: {item.visit_minutes}m
                                    </span>
                                    {item.travel_minutes > 0 && (
                                      <span className="bg-indigo-100/70 text-indigo-900 px-2 py-0.5 rounded-lg">
                                        Transit: {item.travel_minutes}m
                                      </span>
                                    )}
                                    {item.waiting_minutes > 0 && (
                                      <span className="bg-amber-100/70 text-amber-900 px-2 py-0.5 rounded-lg">
                                        Queue: {item.waiting_minutes}m
                                      </span>
                                    )}
                                    {item.buffer_minutes > 0 && (
                                      <span className="bg-slate-200/70 text-slate-900 px-2 py-0.5 rounded-lg">
                                        Buffer Margin: {item.buffer_minutes}m
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

                {/* 4. Budget Section with Explicit Visual Distinction */}
                <Card className="shadow-md rounded-3xl">
                  <CardHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                        <div>
                          <CardTitle className="text-lg font-bold">Deterministic Budget Allocation</CardTitle>
                          <CardDescription className="text-xs">
                            Integer minor-unit arithmetic distinguishing Estimated, Actual, Remaining, and Over-Budget.
                          </CardDescription>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild className="text-xs rounded-xl">
                        <Link href={`/trips/${trip.id}/budget`}>
                          Open Expense Ledger <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* 4 Core Budget KPI States */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* State 1: Estimated */}
                      <div className="p-4 rounded-2xl border bg-blue-50/60 border-blue-200 space-y-1">
                        <div className="flex items-center justify-between text-blue-700 text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Calculator className="w-4 h-4" /> Estimated Cap
                          </span>
                          <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">Target</Badge>
                        </div>
                        <div className="text-2xl font-black text-blue-950">
                          ₹{plan.budget.allocatedBudget.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-blue-700">Trip allocation ceiling</p>
                      </div>

                      {/* State 2: Actual / Total Planned Spend */}
                      <div className="p-4 rounded-2xl border bg-emerald-50/60 border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Receipt className="w-4 h-4" /> Actual Planned
                          </span>
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">Calculated</Badge>
                        </div>
                        <div className="text-2xl font-black text-emerald-950">
                          ₹{plan.budget.totalCost.toLocaleString()}
                        </div>
                        <p className="text-[11px] text-emerald-700">
                          {Math.round((plan.budget.totalCost / plan.budget.allocatedBudget) * 100)}% of total budget
                        </p>
                      </div>

                      {/* State 3: Remaining Surplus */}
                      <div className="p-4 rounded-2xl border bg-sky-50/60 border-sky-200 space-y-1">
                        <div className="flex items-center justify-between text-sky-700 text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            <TrendingDown className="w-4 h-4" /> Remaining
                          </span>
                          <Badge variant="outline" className="text-[10px] border-sky-300 text-sky-700">Surplus</Badge>
                        </div>
                        <div className="text-2xl font-black text-sky-950">
                          ₹{Math.max(0, plan.budget.remainingBudget).toLocaleString()}
                        </div>
                        <p className="text-[11px] text-sky-700">Unallocated reserve buffer</p>
                      </div>

                      {/* State 4: Over Budget Alert / Health State */}
                      <div
                        className={`p-4 rounded-2xl border space-y-1 ${
                          plan.budget.isOverBudget
                            ? "bg-rose-50 border-rose-300 ring-1 ring-rose-400 text-rose-950"
                            : "bg-muted/40 border-muted text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1.5">
                            {plan.budget.isOverBudget ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                            ) : (
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            )}
                            Budget Health
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              plan.budget.isOverBudget
                                ? "border-rose-300 text-rose-700 bg-rose-100"
                                : "border-emerald-300 text-emerald-700 bg-emerald-100"
                            }`}
                          >
                            {plan.budget.isOverBudget ? "Over Budget" : "Balanced"}
                          </Badge>
                        </div>
                        <div
                          className={`text-2xl font-black ${
                            plan.budget.isOverBudget ? "text-rose-700" : "text-foreground"
                          }`}
                        >
                          {plan.budget.isOverBudget
                            ? `+₹${(plan.budget.totalCost - plan.budget.allocatedBudget).toLocaleString()}`
                            : "₹0 Deficit"}
                        </div>
                        <p className="text-[11px]">
                          {plan.budget.isOverBudget
                            ? `${plan.budget.overBudgetPercentage}% above planned cap`
                            : "Cost within allocated bounds"}
                        </p>
                      </div>
                    </div>

                    {/* Budget Overview Progress Bar */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">Category Proportions</span>
                        <span className="font-bold text-foreground">Total: ₹{plan.budget.totalCost.toLocaleString()}</span>
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
                        <div key={cat} className="p-3 rounded-2xl border bg-card space-y-1">
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
                      <Alert className="bg-amber-50 border-amber-300 text-amber-900 rounded-2xl">
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
                  <Card className="shadow-md rounded-3xl">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center gap-2">
                        <Bed className="w-5 h-5 text-amber-600" />
                        <CardTitle className="text-base font-bold">Selected Lodging</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="p-4 rounded-2xl border bg-amber-50/40 border-amber-200 space-y-2">
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
                          <Badge key={am} variant="outline" className="text-[11px] bg-muted/40 rounded-lg">
                            {am}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transport */}
                  <Card className="shadow-md rounded-3xl">
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-base font-bold">Transit & Local Mobility</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="p-4 rounded-2xl border bg-blue-50/40 border-blue-200 space-y-2">
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
                <Card className="shadow-md rounded-3xl">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-rose-600" />
                      <CardTitle className="text-base font-bold">Curated Dining Schedule</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {plan.food.meals.map((meal, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl border bg-card space-y-1.5 text-xs hover:border-primary/40 transition-colors">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-rose-700 border-rose-300">
                              Day {meal.dayNumber} {meal.mealType}
                            </Badge>
                            <span className="font-semibold">{meal.restaurant.price_level}</span>
                          </div>
                          <p className="font-bold text-sm text-foreground">{meal.restaurant.name}</p>
                          <p className="text-muted-foreground">{meal.restaurant.cuisine}</p>
                          <div className="flex justify-between text-[11px] pt-1.5 border-t text-muted-foreground">
                            <span>Est. Cost:</span>
                            <span className="font-semibold text-foreground">₹{meal.estimatedCost.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 8. Selected Attractions Section */}
                <Card className="shadow-md rounded-3xl">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-emerald-600" />
                      <CardTitle className="text-base font-bold">Selected Attractions & Heritage Sites</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {plan.attractions.map((a, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl border bg-card space-y-2 text-xs hover:border-primary/40 transition-colors">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-sm text-foreground">{a.attraction.name}</h4>
                            <Badge variant="secondary" className="text-[10px] rounded-md">
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

        {/* Confirmation Modal for Trip Deletion */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Delete Trip Itinerary?"
          description="Are you sure you want to delete this trip itinerary? All associated scheduled items, budget ledgers, and notes will be permanently removed."
          confirmText="Delete Trip"
          cancelText="Keep Trip"
          isDestructive={true}
          isLoading={deleting}
          onConfirm={confirmDeleteTrip}
          onCancel={() => setShowDeleteModal(false)}
        />
      </main>
    </div>
  );
}
