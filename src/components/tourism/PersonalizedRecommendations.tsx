"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Sliders,
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  Compass,
  CheckCircle2,
  Calendar,
  Layers,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PillButton } from "@/components/ui/pill-button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { OnboardingPanel } from "./OnboardingPanel";
import {
  PersonalizedRecommendationsResult,
  RecommendationOption,
} from "@/types/recommendations";

interface PersonalizedRecommendationsProps {
  onSelectLocation?: (locationId: string) => void;
  className?: string;
}

export function PersonalizedRecommendations({
  onSelectLocation,
  className = "",
}: PersonalizedRecommendationsProps) {
  const [data, setData] = useState<PersonalizedRecommendationsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load personalized recommendations", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleSyncItineraries = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/recommendations/sync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setSyncMessage(
          `Synced: Analyzed ${json.tripsAnalyzed} trips & ${json.itinerariesAnalyzed} days. Learned top tastes: ${json.topLearnedCategories.join(", ")}.`
        );
        // Refresh recommendations with updated weights
        await fetchRecommendations();
      }
    } catch (e) {
      console.error("Failed to sync itineraries", e);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Onboarding Questionnaire Modal */}
      {isOnboardingOpen && (
        <OnboardingPanel
          isOpen={isOnboardingOpen}
          isModal={true}
          onClose={() => setIsOnboardingOpen(false)}
          onSaved={() => {
            setIsOnboardingOpen(false);
            fetchRecommendations();
          }}
        />
      )}

      {/* Main Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              AI Recommendation Engine
            </span>
            {data && data.userSummary && (
              <span className="text-xs text-slate-500">
                Pace: <strong className="capitalize text-slate-700">{data.userSummary.preferredPace}</strong> · Tier: <strong className="capitalize text-slate-700">{data.userSummary.budgetTier}</strong>
              </span>
            )}
          </div>
          <h2 className="font-instrument text-2xl sm:text-3xl font-normal text-slate-900">
            Recommended For You
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-light mt-0.5">
            Personalized destinations and NATMO circuits computed from your onboarding preferences and
            dynamically refined by the places you save in your itineraries.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncItineraries}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-slate-900" : "text-slate-500"}`} />
            {syncing ? "Analyzing Trips..." : "Learn from Itineraries"}
          </button>

          <PillButton
            variant="small"
            onClick={() => setIsOnboardingOpen(true)}
            className="bg-black text-white hover:bg-slate-800 text-xs px-4 py-2"
          >
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            Preferences
          </PillButton>
        </div>
      </div>

      {/* Sync / Learning Feedback Banner */}
      {syncMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !data || data.recommendations.length === 0 ? (
        <Card className="p-10 text-center border-dashed border-slate-200 bg-white/50 space-y-3">
          <Compass className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-instrument text-2xl text-slate-900">No recommendations ready yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Complete the quick 3-step onboarding form so we can match your travel style against 70+
            curated Indian locations and NATMO circuits.
          </p>
          <PillButton
            variant="small"
            onClick={() => setIsOnboardingOpen(true)}
            className="bg-black text-white hover:bg-slate-800"
          >
            Setup Preferences Now
          </PillButton>
        </Card>
      ) : (
        <>
          {/* Recommended Destinations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.recommendations.map((rec) => {
              const loc = rec.location;
              return (
                <Card
                  key={loc.id}
                  className="group rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between p-5 space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Match Score Badge & Seasonality */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-700" />
                        {rec.matchPercentage}% Match
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          rec.seasonalSuitability === "peak"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {rec.seasonalSuitability === "peak" ? "Peak Season" : "Good to Visit"}
                      </span>
                    </div>

                    {/* Name & Geographic Hierarchy */}
                    <div>
                      <h3 className="font-instrument text-2xl font-normal text-slate-900 leading-tight">
                        {loc.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>
                          {loc.city}, {loc.district} Dist., {loc.state}
                        </span>
                      </div>
                    </div>

                    {/* Explainable Match Rationale Bullets */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 block">
                        Why We Recommend This
                      </span>
                      {rec.matchReasons.map((reason, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-slate-700 leading-tight"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {loc.description}
                    </p>
                  </div>

                  {/* Operational Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{loc.operational.ideal_duration_hours || 2} hrs</span>
                    </div>
                    <div className="font-medium text-slate-900">
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
              );
            })}
          </div>

          {/* Recommended NATMO Circuits Section */}
          {data.circuitRecommendations && data.circuitRecommendations.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-purple-600" />
                <h3 className="font-instrument text-2xl font-normal text-slate-900">
                  Recommended NATMO Thematic Circuits
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.circuitRecommendations.map((circuit, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {circuit.theme}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Top Match
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 text-sm">{circuit.circuitName}</h4>
                      <p className="text-xs text-slate-500 line-clamp-3 font-light leading-relaxed">
                        {circuit.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{circuit.states.join(", ")}</span>
                      <span className="font-medium text-slate-900 flex items-center gap-0.5">
                        {circuit.locations.length} Sites
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
