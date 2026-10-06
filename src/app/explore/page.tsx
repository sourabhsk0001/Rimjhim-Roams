"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  Compass,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  Sparkles,
  MapPin,
  Landmark,
  Layers,
  Globe,
  Mountain,
  Palmtree,
  Flame,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DestinationCard, DemoBadge } from "@/components/travel/cards";
import { Destination } from "@/types/travel";
import { IndiaTourismExplorer } from "@/components/tourism/IndiaTourismExplorer";
import { NATMOGeoNamesSearchBar } from "@/components/tourism/NATMOGeoNamesSearchBar";
import { PersonalizedRecommendations } from "@/components/tourism/PersonalizedRecommendations";
import { GroqAISearchDeck } from "@/components/tourism/GroqAISearchDeck";
import { AutocompleteSuggestion } from "@/types/recommendations";

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState<"india_kb" | "recommendations" | "destinations" | "groq_ai">("india_kb");
  const [groqQuery, setGroqQuery] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState("");
  const [climate, setClimate] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDestinations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (climate !== "all") params.set("climate", climate);

      const res = await fetch(`/api/destinations?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load destinations.");
      }
      const data = await res.json();
      setDestinations(data.destinations || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error loading destination catalog."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "destinations") {
      fetchDestinations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, climate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDestinations();
  };

  const handleAutocompleteSelect = (suggestion: AutocompleteSuggestion) => {
    // If user clicks a suggestion, switch to KB explorer and let it filter
    setActiveTab("india_kb");
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans">
      <Navigation />

      {/* 1. Cinematic Explore Hero Banner */}
      <section className="relative bg-slate-950 text-white overflow-visible py-14 sm:py-18 border-b border-white/10">
        {/* Ambient Gradient Lighting */}
        <div
          className="absolute -top-24 left-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 right-1/4 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs sm:text-sm font-medium mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ministry of Tourism • NATMO • OpenStreetMap • GeoNames</span>
          </div>

          <h1 className="font-instrument text-4xl sm:text-6xl md:text-7xl font-normal tracking-[-2px] text-white leading-tight max-w-4xl mx-auto">
            Explore India&apos;s Living Heritage &amp; Landscapes
          </h1>

          <p className="font-sans text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto mt-3 leading-relaxed">
            Discover verified attractions, UNESCO monuments, thematic circuits, wildlife corridors, and accommodations across all 36 States &amp; Union Territories.
          </p>

          {/* 2. Embedded Live NATMO & GeoNames Autocomplete Search Bar */}
          <div className="max-w-2xl mx-auto mt-8 relative z-30">
            <div className="bg-slate-900/95 backdrop-blur-xl p-2 rounded-2xl sm:rounded-full border border-white/25 shadow-2xl overflow-visible relative">
              <NATMOGeoNamesSearchBar
                placeholder="Search any state (e.g. Rajasthan, Kerala), circuit, or attraction..."
                onSelect={handleAutocompleteSelect}
                onGroqSearch={(q) => {
                  setGroqQuery(q);
                  setActiveTab("groq_ai");
                }}
                className="w-full"
              />
            </div>

            {/* Quick Thematic Circuit Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("groq_ai")}
                className="px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium transition-all cursor-pointer active:scale-95 flex items-center gap-1 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>⚡ Groq AI Search</span>
              </button>
              <span className="text-slate-400 font-medium">Popular:</span>
              {[
                "🏛️ Golden Triangle",
                "🏖️ Coastal Circuit",
                "🏜️ Desert Circuit",
                "🛕 Buddhist Circuit",
                "🌿 Himalayan Vista",
              ].map((circuit) => (
                <button
                  key={circuit}
                  type="button"
                  onClick={() => setActiveTab("india_kb")}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition-all cursor-pointer active:scale-95"
                >
                  {circuit}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto mt-10 pt-8 border-t border-white/10 text-center">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-instrument text-2xl sm:text-3xl font-normal text-amber-200">36 / 36</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">States &amp; UTs Covered</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-instrument text-2xl sm:text-3xl font-normal text-sky-200">100+ Verified</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">NATMO / MoT POIs</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-instrument text-2xl sm:text-3xl font-normal text-emerald-200">100% Free</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Geospatial RAG</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="font-instrument text-2xl sm:text-3xl font-normal text-purple-200">AI Synthesized</div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mt-0.5">Day-by-Day Itineraries</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Exploration Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-rise">
        {/* Navigation Mode Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("india_kb")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "india_kb"
                  ? "bg-slate-950 text-white shadow-md scale-[1.02]"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Landmark className="w-4 h-4 text-amber-500" />
              <span>Official India Tourism KB (36 States &amp; UTs)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("recommendations")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "recommendations"
                  ? "bg-slate-950 text-white shadow-md scale-[1.02]"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>AI Personalized Recommendations</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("destinations")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "destinations"
                  ? "bg-slate-950 text-white shadow-md scale-[1.02]"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-500" />
              <span>City Portals Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("groq_ai")}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "groq_ai"
                  ? "bg-amber-500 text-slate-950 shadow-md font-bold scale-[1.02]"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>⚡ Groq AI Search</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1.5 self-end sm:self-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Live Data</span>
          </div>
        </div>

        {/* Tab 1: Official India Tourism Knowledge Base (Default) */}
        {activeTab === "india_kb" && (
          <div className="space-y-6">
            <IndiaTourismExplorer />
          </div>
        )}

        {/* Tab 2: AI Personalized Recommendations */}
        {activeTab === "recommendations" && (
          <div className="space-y-6">
            <PersonalizedRecommendations />
          </div>
        )}

        {/* Tab 3: City Portals Catalog */}
        {activeTab === "destinations" && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  placeholder="Search by city, state, or region (e.g. Goa, Jaipur, Bengal)..."
                  className="pl-9 rounded-full border-slate-200 text-sm focus-visible:ring-black"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={climate}
                  onChange={(e) => setClimate(e.target.value)}
                  className="flex h-9 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-medium text-slate-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
                >
                  <option value="all">All Climates</option>
                  <option value="tropical">Tropical</option>
                  <option value="semi-arid">Semi-Arid</option>
                  <option value="alpine">Alpine / Hill Station</option>
                  <option value="subtropical">Subtropical</option>
                </select>
              </div>
            </form>

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Error Loading Catalog</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : destinations.length === 0 ? (
              /* Empty State */
              <Card className="border-dashed p-12 text-center space-y-4 bg-card/50">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-semibold text-lg">No destinations found</h3>
                  <p className="text-sm text-muted-foreground">
                    No destinations matched &quot;{search}&quot;. Try adjusting your keywords or clearing the climate filter.
                  </p>
                </div>
              </Card>
            ) : (
              /* Destination Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {destinations.map((destination) => (
                  <DestinationCard key={destination.id} destination={destination} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Groq AI Travel Search */}
        {activeTab === "groq_ai" && (
          <div className="space-y-6">
            <GroqAISearchDeck
              initialQuery={groqQuery}
              onSelectLocation={(locName) => {
                setSearch(locName);
                setActiveTab("india_kb");
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
