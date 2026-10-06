"use client";

import React, { useState } from "react";
import {
  Zap,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  IndianRupee,
  Layers,
  Calendar,
  ArrowRight,
  Loader2,
  Tag,
  Mountain,
} from "lucide-react";
import { GroqSearchResult } from "@/types/groq-search";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlaceComfortBadge } from "@/components/travel/place-comfort-badge";

interface GroqAISearchDeckProps {
  initialQuery?: string;
  onSelectLocation?: (locationName: string) => void;
  className?: string;
}

const PRESET_QUERIES = [
  "Peaceful sunset beaches in Goa with coastal dining",
  "Royal heritage forts and palaces in Rajasthan under ₹1500",
  "Misty tea plantations and mountain trails in Darjeeling",
  "High-altitude mountain retreats and alpine valleys in Manali",
  "Sacred spiritual temples and tranquil river ghats",
];

export function GroqAISearchDeck({
  initialQuery = "",
  onSelectLocation,
  className = "",
}: GroqAISearchDeckProps) {
  const [query, setQuery] = useState(initialQuery);
  const [engine, setEngine] = useState<"gemini" | "groq">("gemini");
  const [budgetTier, setBudgetTier] = useState<"budget" | "moderate" | "luxury">("moderate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GroqSearchResult | null>(null);

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tourism/search/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          budgetTier,
          limit: 6,
          provider: engine,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to execute AI search.");
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error querying AI search.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. AI Search Control Bar */}
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-amber-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border ${engine === "gemini" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                {engine === "gemini" ? (
                  <Sparkles className="w-5 h-5 fill-blue-300 text-blue-300" />
                ) : (
                  <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
                )}
              </span>
              <div>
                <h3 className="font-semibold text-lg text-white tracking-tight flex items-center gap-2">
                  {engine === "gemini" ? "Gemini 3.5 Flash Search" : "Groq LPU Travel Search"}
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {engine === "gemini" ? "Gemini 3.5 Flash" : "Ultra-Fast LPU"}
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Natural language reasoning across 28 Indian States & NATMO Thematic Circuits
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Engine Toggle */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setEngine("gemini")}
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all ${
                    engine === "gemini"
                      ? "bg-blue-600 text-white shadow-xs font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                  title="Google Gemini 3.5 Flash Multimodal Reasoning"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini 3.5</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEngine("groq")}
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-all ${
                    engine === "groq"
                      ? "bg-amber-500 text-slate-950 shadow-xs font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                  title="Groq LPU Ultra-Fast Inference"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Groq LPU</span>
                </button>
              </div>

              {/* Budget Filter */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 text-xs">
                <span className="text-slate-400 px-1.5">Budget:</span>
                {(["budget", "moderate", "luxury"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setBudgetTier(tier)}
                    className={`px-2 py-1 rounded capitalize font-medium transition-all ${
                      budgetTier === tier
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything (e.g. 'Peaceful beaches in Goa with sunset dining and light budget')"
                className="w-full bg-slate-800/80 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Reasoning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>Ask Groq</span>
                </>
              )}
            </button>
          </form>

          {/* Presets */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span className="font-medium">Try:</span>
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(preset);
                  handleSearch(preset);
                }}
                className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 2. Error Display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* 3. Loading State */}
      {loading && !result && (
        <Card className="p-8 text-center bg-white border border-slate-200">
          <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-600 mb-3 animate-pulse">
            <Zap className="w-6 h-6 fill-amber-500" />
          </div>
          <h4 className="font-semibold text-slate-900 mb-1">Groq LPU Analyzing Query</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Extracting travel intent, matching geographic circuits, and synthesizing verified sights at high tokens/sec...
          </p>
        </Card>
      )}

      {/* 4. Results Deck */}
      {result && (
        <div className="space-y-6">
          {/* AI Synthesis Card */}
          <Card className="p-5 sm:p-6 bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-100 text-amber-700">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h4 className="font-semibold text-slate-900 text-base">AI Travel Synthesis</h4>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                <span>{result.model}</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{result.executionTimeMs}ms</span>
              </div>
            </div>

            <p className="text-slate-700 text-sm leading-relaxed mb-4">
              {result.aiSummary}
            </p>

            {/* Extracted Intent Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 font-medium">
                <Compass className="w-3.5 h-3.5" />
                <span>Style: {result.intent.travelStyle}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Season: {result.intent.idealSeason}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium capitalize">
                <IndianRupee className="w-3.5 h-3.5" />
                <span>Tier: {result.intent.estimatedBudgetTier}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 font-medium capitalize">
                <Clock className="w-3.5 h-3.5" />
                <span>Pace: {result.intent.suggestedPace}</span>
              </span>
              {result.intent.detectedRegions.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{result.intent.detectedRegions.join(", ")}</span>
                </span>
              )}
            </div>
          </Card>

          {/* Matched Attractions */}
          {result.matchedLocations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Curated Verified Attractions ({result.matchedLocations.length})
                </h4>
                <span className="text-xs text-slate-500">Ministry of Tourism & OSM Verified</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.matchedLocations.map((loc) => (
                  <Card
                    key={loc.id}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h5 className="font-semibold text-slate-900 text-sm leading-snug">
                            {loc.name}
                          </h5>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {loc.district ? `${loc.district}, ` : ""}{loc.state}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold shrink-0">
                          {loc.category}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                        {loc.description}
                      </p>

                      {/* Comfort Badge Trigger */}
                      <div className="mb-3">
                        <PlaceComfortBadge
                          placeName={loc.name}
                          destination={loc.state}
                          category={loc.category}
                          latitude={loc.latitude}
                          longitude={loc.longitude}
                          variant="pill"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                        {loc.operational?.entry_fee_inr === 0 ? "Free Entry" : `₹${loc.operational?.entry_fee_inr || 0}`}
                      </span>
                      {onSelectLocation && (
                        <button
                          type="button"
                          onClick={() => onSelectLocation(loc.name)}
                          className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center gap-1"
                        >
                          Explore <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Matched Thematic Circuits */}
          {result.matchedCircuits.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Mountain className="w-4 h-4 text-purple-600" />
                  Relevant NATMO Thematic Circuits ({result.matchedCircuits.length})
                </h4>
                <span className="text-xs text-slate-500">National Atlas & Thematic Mapping</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.matchedCircuits.map((circ) => (
                  <Card
                    key={circ.id}
                    className="p-4 bg-gradient-to-br from-purple-50/50 to-white border border-purple-100 hover:border-purple-200 transition"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h5 className="font-semibold text-slate-900 text-sm">{circ.name}</h5>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {circ.theme}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{circ.description}</p>
                    <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                      <span><strong>Key Stops:</strong> {circ.keyDestinations.join(" → ")}</span>
                      <span><strong>Best:</strong> {circ.bestMonths}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Follow-Ups */}
          {result.suggestedFollowUps.length > 0 && (
            <div className="pt-2">
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Suggested Follow-Up Inquiries
              </h5>
              <div className="flex flex-wrap gap-2">
                {result.suggestedFollowUps.map((followUp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(followUp);
                      handleSearch(followUp);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-800 text-xs border border-slate-200 transition text-left flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{followUp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
