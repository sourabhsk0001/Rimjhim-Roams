"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CloudSun,
  Bed,
  Utensils,
  Car,
  Ticket,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Check,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DiscoveredDestinationResult } from "@/types/discovery";
import { TravellerType } from "@/types/database";

const AVAILABLE_PREFERENCES = [
  { id: "nature", label: "Nature & Views" },
  { id: "adventure", label: "Adventure & Sports" },
  { id: "beach", label: "Beaches & Coastal" },
  { id: "heritage", label: "Heritage & Palaces" },
  { id: "food", label: "Food & Gastronomy" },
  { id: "mountains", label: "Hills & Mountains" },
  { id: "culture", label: "Art & Culture" },
  { id: "relaxation", label: "Leisure & Wellness" },
];

export function DestinationDiscoveryWidget() {
  const router = useRouter();

  // Search Inputs
  const [origin, setOrigin] = useState("Kolkata");
  const [budget, setBudget] = useState<number>(20000);
  const [durationDays, setDurationDays] = useState<number>(5);
  const [travellerCount, setTravellerCount] = useState<number>(3);
  const [travellerType, setTravellerType] = useState<TravellerType>("friends");
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([
    "nature",
    "adventure",
  ]);

  // Results & Loading State
  const [results, setResults] = useState<DiscoveredDestinationResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const togglePreference = (prefId: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(prefId)
        ? prev.filter((p) => p !== prefId)
        : [...prev, prefId]
    );
  };

  const handleDiscover = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!origin.trim()) {
      setError("Please specify your origin city (e.g. Kolkata, Delhi, Mumbai).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/destinations/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: origin.trim(),
          budget: Number(budget),
          currency: "INR",
          durationDays: Number(durationDays),
          travellerCount: Number(travellerCount),
          travellerType,
          preferences: selectedPreferences,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to discover destinations.");
      }

      setResults(data.destinations || []);
      setActiveTab(0);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while finding destinations."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlanDestination = (destination: DiscoveredDestinationResult) => {
    const today = new Date();
    today.setDate(today.getDate() + 14); // 2 weeks out default
    const startDate = today.toISOString().split("T")[0];

    const end = new Date(today);
    end.setDate(today.getDate() + (durationDays - 1));
    const endDate = end.toISOString().split("T")[0];

    const query = new URLSearchParams({
      origin,
      destination: destination.destination.name,
      budget: budget.toString(),
      currency: "INR",
      startDate,
      endDate,
      duration: durationDays.toString(),
      travellers: travellerCount.toString(),
      travellerType,
    });

    router.push(`/trips/new?${query.toString()}`);
  };

  return (
    <div className="w-full space-y-8" id="discovery-planner">
      {/* Input Discovery Form Card */}
      <Card className="border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden bg-white/95 backdrop-blur">
        <div className="bg-gradient-to-br from-[#071324] via-[#0f172a] to-[#1e293b] text-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <Badge className="bg-white/20 text-white border-none uppercase tracking-wider text-xs rounded-full">
                TripWise Discovery Engine
              </Badge>
              <h2 className="font-instrument text-3xl sm:text-4xl font-normal tracking-[-1.5px] text-white">
                Don&apos;t Know Where to Go? Let AI Calculate It.
              </h2>
              <p className="text-slate-300 text-sm max-w-2xl font-normal">
                Enter your departure city, budget cap, and trip length. We calculate real transit, lodging, meals, and activities across candidate destinations to show you everywhere you can feasibly travel.
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleDiscover} className="space-y-6">
            {/* Top row: Origin, Budget, Duration, Travellers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Origin */}
              <div className="space-y-2">
                <Label htmlFor="origin" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> Departure City
                </Label>
                <Input
                  id="origin"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Kolkata, Delhi, Mumbai"
                  className="h-11"
                  required
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Total Budget (₹)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="budget"
                    type="number"
                    min="5000"
                    step="1000"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="h-11"
                    required
                  />
                </div>
              </div>

              {/* Duration Days */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Trip Duration
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 w-11"
                    onClick={() => setDurationDays((d) => Math.max(1, d - 1))}
                  >
                    -
                  </Button>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="14"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="h-11 text-center font-bold"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-11 w-11"
                    onClick={() => setDurationDays((d) => Math.min(14, d + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Group Size & Type */}
              <div className="space-y-2">
                <Label htmlFor="travellers" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" /> Travellers & Group
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11 w-9 px-0"
                      onClick={() => setTravellerCount((c) => Math.max(1, c - 1))}
                    >
                      -
                    </Button>
                    <Input
                      id="travellers"
                      type="number"
                      min="1"
                      max="10"
                      value={travellerCount}
                      onChange={(e) => setTravellerCount(Number(e.target.value))}
                      className="h-11 text-center font-semibold px-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-11 w-9 px-0"
                      onClick={() => setTravellerCount((c) => Math.min(10, c + 1))}
                    >
                      +
                    </Button>
                  </div>
                  <select
                    value={travellerType}
                    onChange={(e) => setTravellerType(e.target.value as TravellerType)}
                    className="h-11 rounded-md border border-input bg-background px-2 text-xs font-medium"
                  >
                    <option value="solo">Solo</option>
                    <option value="couple">Couple</option>
                    <option value="friends">Friends</option>
                    <option value="family">Family</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preference Chips */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Trip Preferences (Select All That Apply)
              </Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVAILABLE_PREFERENCES.map((pref) => {
                  const isSelected = selectedPreferences.includes(pref.id);
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => togglePreference(pref.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/40 text-muted-foreground border-muted hover:border-foreground/30"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {pref.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Discovery Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Primary Action Button */}
            <div className="flex justify-center pt-2">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full sm:w-auto px-10 h-12 text-sm font-medium gap-2.5 bg-black hover:bg-black/90 text-white rounded-full shadow-sm hover:scale-[1.03] transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Compass className="w-4 h-4 text-white" />
                )}
                FIND WHERE I SHOULD GO
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Discovery Results Section */}
      {results && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <Compass className="w-6 h-6 text-primary" />
                Found {results.length} Feasible Destinations from {origin}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculated with deterministic minor-unit budget engine. Showing options within ₹{budget.toLocaleString()} for {durationDays} days.
              </p>
            </div>

            {/* Live Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 border-amber-300 text-amber-900 bg-amber-50 text-xs">
                <SlidersHorizontal className="w-3 h-3 text-amber-600" />
                DEMO ESTIMATE PRICING
              </Badge>
            </div>
          </div>

          {results.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <p className="text-muted-foreground font-medium">
                No destinations found within ₹{budget.toLocaleString()} for {durationDays} days.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try increasing your budget or reducing duration to uncover candidate getaways.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item, idx) => (
                <Card
                  key={item.destination.id}
                  className="overflow-hidden flex flex-col rounded-2xl border border-slate-200/80 hover:border-slate-400 transition-all shadow-sm group bg-white/90"
                >
                  {/* Hero Header with Climate & Score */}
                  <div className="relative h-44 w-full bg-muted overflow-hidden">
                    {item.destination.hero_image ? (
                      <Image
                        src={item.destination.hero_image}
                        alt={item.destination.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#071324] to-[#1e293b] flex items-center justify-center text-white font-bold">
                        {item.destination.name}
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <Badge className="bg-emerald-600 text-white font-bold text-xs border-none shadow-sm rounded-full">
                        {item.matchScore}% Match
                      </Badge>
                      <Badge className="bg-black/60 backdrop-blur text-white text-[10px] border-none rounded-full">
                        {item.destination.climate}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-instrument text-2xl font-normal tracking-[-0.5px]">
                        {item.destination.name}
                      </h4>
                      <p className="text-xs text-slate-200 flex items-center gap-1 font-normal">
                        <MapPin className="w-3 h-3 text-amber-300" />
                        <span>{item.destination.state_province}, {item.destination.country}</span>
                      </p>
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 space-y-4">
                    {/* Budget & Cost Summary */}
                    <div className="p-3 rounded-xl bg-muted/40 border space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">Estimated Trip Cost:</span>
                        <div className="text-right">
                          <span className="text-lg font-extrabold text-foreground">
                            {item.estimatedTotalCostFormatted}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold block flex items-center justify-end gap-1">
                            <TrendingDown className="w-3 h-3" />
                            ₹{item.budgetSurplusDeficit.toLocaleString()} under budget
                          </span>
                        </div>
                      </div>

                      {/* 6 Category Breakdown Pills */}
                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t text-[11px]">
                        <div className="bg-background/80 p-1.5 rounded border text-center">
                          <span className="text-muted-foreground block text-[10px]">Transit</span>
                          <span className="font-bold">{item.transportCostFormatted}</span>
                        </div>
                        <div className="bg-background/80 p-1.5 rounded border text-center">
                          <span className="text-muted-foreground block text-[10px]">Hotel</span>
                          <span className="font-bold">{item.hotelCostFormatted}</span>
                        </div>
                        <div className="bg-background/80 p-1.5 rounded border text-center">
                          <span className="text-muted-foreground block text-[10px]">Food</span>
                          <span className="font-bold">{item.foodCostFormatted}</span>
                        </div>
                        <div className="bg-background/80 p-1.5 rounded border text-center">
                          <span className="text-muted-foreground block text-[10px]">Activities</span>
                          <span className="font-bold">{item.activitiesCostFormatted}</span>
                        </div>
                        <div className="bg-background/80 p-1.5 rounded border text-center">
                          <span className="text-muted-foreground block text-[10px]">Local Cab</span>
                          <span className="font-bold">{item.localTransportCostFormatted}</span>
                        </div>
                        <div className="bg-background/80 p-1.5 rounded border text-center">
                          <span className="text-muted-foreground block text-[10px]">Buffer</span>
                          <span className="font-bold">{item.emergencyBufferCostFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Travel Time & Mode */}
                    <div className="flex items-center justify-between text-xs py-1 border-b text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-blue-600" /> Travel Time:
                      </span>
                      <span className="font-semibold text-foreground">{item.approximateTravelTime}</span>
                    </div>

                    {/* Live Weather Forecast if available */}
                    {item.weather && (
                      <div className="flex items-center justify-between text-xs py-1 border-b text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CloudSun className="w-3.5 h-3.5 text-amber-500" /> Current Weather:
                        </span>
                        <span className="font-semibold text-foreground">
                          {item.weather.currentTemp}°C • {item.weather.condition} ({item.weather.precipitationProbability}% Rain)
                        </span>
                      </div>
                    )}

                    {/* Major Attractions */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Major Sights & Highlights
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.majorAttractions.map((attr, aIdx) => (
                          <Badge
                            key={aIdx}
                            variant="secondary"
                            className="text-[11px] px-2 py-0.5 font-normal bg-card border"
                          >
                            {attr.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Match Reasons */}
                    <div className="space-y-1 text-xs">
                      {item.matchReasons.map((reason, rIdx) => (
                        <p key={rIdx} className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                          <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>{reason}</span>
                        </p>
                      ))}
                    </div>

                    {/* Disclaimer */}
                    <p className="text-[10px] text-muted-foreground italic border-t pt-2">
                      {item.estimateDisclaimer}
                    </p>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button
                      onClick={() => handlePlanDestination(item)}
                      className="w-full gap-2 font-medium bg-black hover:bg-black/90 text-white rounded-full shadow-sm hover:scale-[1.02] transition-transform text-xs"
                    >
                      <span>View Plan & Customize</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
