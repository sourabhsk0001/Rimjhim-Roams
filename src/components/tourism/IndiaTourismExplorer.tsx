"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Compass,
  Search,
  Filter,
  MapPin,
  Clock,
  IndianRupee,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Globe,
  Loader2,
  Calendar,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PillButton } from "@/components/ui/pill-button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { IndiaTourismLocation, StateUTSummary, TourismCategory } from "@/types/india-tourism";
import { NATMOGeoNamesSearchBar } from "./NATMOGeoNamesSearchBar";
import { PersonalizedRecommendations } from "./PersonalizedRecommendations";

interface ItineraryModalData {
  stateOrRegion: string;
  totalDays: number;
  totalAttractions: number;
  totalEntryFeeInr: number;
  daysPlan: Array<{
    day: number;
    theme: string;
    estimatedHours: number;
    estimatedEntryFeeInr: number;
    locations: IndiaTourismLocation[];
  }>;
  suggestedRoute: string[];
  travelTips: string[];
}

export function IndiaTourismExplorer() {
  const [locations, setLocations] = useState<IndiaTourismLocation[]>([]);
  const [states, setStates] = useState<StateUTSummary[]>([]);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"catalog" | "recommendations">("catalog");

  // AI Itinerary Recommendation state
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [itineraryResult, setItineraryResult] = useState<ItineraryModalData | null>(null);

  // Fetch states list
  useEffect(() => {
    async function loadStates() {
      try {
        const res = await fetch("/api/tourism/states");
        const data = await res.json();
        if (data.success && data.states_and_uts) {
          setStates(data.states_and_uts);
        }
      } catch (e) {
        console.error("Failed to load states", e);
      }
    }
    loadStates();
  }, []);

  // Fetch locations
  const fetchLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("query", searchQuery.trim());
      if (selectedState !== "all") params.set("state", selectedState);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      params.set("limit", "100");

      const res = await fetch(`/api/tourism/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load India Tourism Knowledge Base.");
      }
      setLocations(data.locations || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error querying knowledge base.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLocations();
  };

  // Generate Itinerary recommendation
  const handleGeneratePlan = async () => {
    const targetState = selectedState === "all" ? "Rajasthan" : selectedState;
    setIsGeneratingPlan(true);
    try {
      const res = await fetch("/api/tourism/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendItinerary: true,
          state: targetState,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          days: 3,
        }),
      });
      const data = await res.json();
      if (data.success && data.recommendation) {
        setItineraryResult(data.recommendation);
      }
    } catch (err) {
      console.error("Failed to generate AI plan", err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Format category label
  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Knowledge Base Multi-source Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                MoT Official Data
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                NATMO Thematic Circuits
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                OSM Decimal Coordinates
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GeoNames 36 States & UTs
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-instrument font-normal text-white">
              Official India Tourism Knowledge Base
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-light">
              Deduplicated and merged multi-source repository across all 28 Indian States and 8 Union
              Territories, designed for precise destination search, GPS mapping, and AI itinerary routing.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <PillButton
              variant="small"
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs px-4 py-2"
            >
              {isGeneratingPlan ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                  Generate AI Itinerary
                </>
              )}
            </PillButton>
          </div>
        </div>
      </div>

      {/* Sub-view mode toggle: Knowledge Base vs Recommendations */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setViewMode("catalog")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
            viewMode === "catalog"
              ? "bg-black text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          All Locations Directory (MoT · OSM)
        </button>
        <button
          type="button"
          onClick={() => setViewMode("recommendations")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
            viewMode === "recommendations"
              ? "bg-black text-white shadow-xs"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Personalized Recommendations
        </button>
      </div>

      {viewMode === "recommendations" ? (
        <PersonalizedRecommendations />
      ) : (
        <>
          {/* Filter Toolbar */}
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs"
          >
            {/* NATMO & GeoNames Autocomplete Search input */}
            <div className="sm:col-span-5">
              <NATMOGeoNamesSearchBar
                placeholder="Search States (GeoNames), Circuits (NATMO), or Sights..."
                onSelect={(item) => {
                  if (item.type === "state" && item.state) {
                    setSelectedState(item.state);
                    setSearchQuery("");
                  } else if (item.type === "district") {
                    if (item.state) setSelectedState(item.state);
                    setSearchQuery(item.district || item.title);
                  } else if (item.type === "natmo_circuit") {
                    setSearchQuery(item.title);
                  } else {
                    setSearchQuery(item.title);
                    if (item.state) setSelectedState(item.state);
                  }
                }}
              />
            </div>

        {/* State / UT Selector */}
        <div className="sm:col-span-4">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full flex h-9 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            <option value="all">All States & Union Territories (36)</option>
            <optgroup label="28 States">
              {states
                .filter((s) => !s.is_union_territory)
                .map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.zone})
                  </option>
                ))}
            </optgroup>
            <optgroup label="8 Union Territories">
              {states
                .filter((s) => s.is_union_territory)
                .map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} (UT)
                  </option>
                ))}
            </optgroup>
          </select>
        </div>

        {/* Category Selector */}
        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full flex h-9 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
          >
            <option value="all">All Categories</option>
            <option value="historical_monument">Historical Monuments</option>
            <option value="temple">Temples & Pilgrimage</option>
            <option value="fort">Forts</option>
            <option value="heritage_palace">Heritage Palaces</option>
            <option value="beach">Beaches</option>
            <option value="national_park">National Parks</option>
            <option value="hill_station">Hill Stations</option>
            <option value="waterfall">Waterfalls</option>
            <option value="cave">Caves</option>
            <option value="cultural_hub">Cultural Hubs</option>
            <option value="lake">Lakes</option>
          </select>
        </div>
      </form>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <span>
          Showing <strong>{locations.length}</strong> official locations
          {selectedState !== "all" && <span> in <strong>{selectedState}</strong></span>}
        </span>
        <span className="text-[11px] text-slate-500 font-mono">
          MoT Verified · OSM Lat/Lng · NATMO Circuits · GeoNames Hierarchy
        </span>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : locations.length === 0 ? (
        <Card className="border-dashed p-12 text-center space-y-4 bg-card/50">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Compass className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-semibold text-lg">No locations found</h3>
            <p className="text-sm text-muted-foreground">
              No tourism sites matched your filter criteria. Try resetting the State or Category dropdowns.
            </p>
          </div>
        </Card>
      ) : (
        /* Locations Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <Card
              key={loc.id}
              className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between p-5 space-y-4"
            >
              <div className="space-y-3">
                {/* Category & Sources Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {formatCategory(loc.category)}
                  </span>
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {loc.sources.details?.unesco_recognized && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        UNESCO
                      </span>
                    )}
                    {loc.sources.mot && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        MoT
                      </span>
                    )}
                    {loc.sources.osm && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        OSM
                      </span>
                    )}
                    {loc.sources.geonames && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                        GeoNames
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Vernacular Name */}
                <div>
                  <h3 className="font-instrument text-2xl font-normal text-slate-900 leading-tight">
                    {loc.name}
                  </h3>
                  {loc.vernacular_name && (
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {loc.vernacular_name}
                    </p>
                  )}
                </div>

                {/* Geographic Administrative Hierarchy (GeoNames) */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {loc.city}, {loc.district} Dist., {loc.state}
                  </span>
                </div>

                {/* Description (MoT verified) */}
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {loc.description}
                </p>

                {/* OSM Coordinates link */}
                <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                  <span>
                    GPS: {loc.latitude.toFixed(4)}°, {loc.longitude.toFixed(4)}°
                  </span>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${loc.latitude}&mlon=${loc.longitude}#map=15/${loc.latitude}/${loc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:text-sky-800 flex items-center gap-0.5 hover:underline"
                  >
                    OSM Map
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Tourism Tags */}
                {loc.tourism_tags && loc.tourism_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {loc.tourism_tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Operational details footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {loc.operational.opening_time} - {loc.operational.closing_time}
                  </span>
                </div>
                <div className="flex items-center font-medium text-slate-900">
                  {loc.operational.entry_fee_inr === 0 ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                      Free Entry
                    </span>
                  ) : (
                    <span>₹{loc.operational.entry_fee_inr}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </>
      )}

      {/* AI Itinerary Modal / Drawer */}
      {itineraryResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-fade-rise">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    AI Travel-Planning Agent
                  </span>
                  <span className="text-xs text-slate-500">
                    {itineraryResult.totalDays} Days · {itineraryResult.totalAttractions} Curated Sights
                  </span>
                </div>
                <h3 className="font-instrument text-3xl font-normal text-slate-900">
                  {itineraryResult.stateOrRegion} Itinerary Plan
                </h3>
              </div>
              <button
                onClick={() => setItineraryResult(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Route Sequence */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                Suggested Route Sequence
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-800 font-medium">
                {itineraryResult.suggestedRoute.map((step, idx) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    <span className="bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                      {step}
                    </span>
                    {idx < itineraryResult.suggestedRoute.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Day by Day Plan */}
            <div className="space-y-4">
              {itineraryResult.daysPlan.map((dp) => (
                <div
                  key={dp.day}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
                        {dp.day}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm">{dp.theme}</h4>
                    </div>
                    <span className="text-xs text-slate-500">
                      ~{dp.estimatedHours} hrs · Est. Tickets: ₹{dp.estimatedEntryFeeInr}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {dp.locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs"
                      >
                        <div className="font-medium text-slate-900">{loc.name}</div>
                        <div className="text-slate-500 text-[11px]">{loc.city}</div>
                        <div className="text-slate-600 line-clamp-2 text-[11px]">
                          {loc.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Travel & Safety Tips */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/50 space-y-2">
              <span className="text-xs font-semibold text-amber-900 block">
                Official Visitor Guidance (MoT & ASI)
              </span>
              <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4">
                {itineraryResult.travelTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <PillButton
                variant="small"
                onClick={() => setItineraryResult(null)}
                className="bg-black text-white hover:bg-slate-800"
              >
                Close Plan
              </PillButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
