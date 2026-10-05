"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  Sliders,
  Clock,
} from "lucide-react";
import { TravellerType, TravelPace } from "@/types/database";

export function HeroPlanningPanel() {
  const router = useRouter();

  // State matching trip planning schema
  const [origin, setOrigin] = useState("Mumbai");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("2026-11-01");
  const [endDate, setEndDate] = useState("2026-11-06");
  const [durationDays, setDurationDays] = useState<number>(5);
  const [budget, setBudget] = useState<string>("25000");
  const [currency, setCurrency] = useState<string>("INR");
  const [travellerCount, setTravellerCount] = useState<number>(2);
  const [travellerType, setTravellerType] = useState<TravellerType>("couple");
  const [travelPace, setTravelPace] = useState<TravelPace>("moderate");
  const [travelStyle, setTravelStyle] = useState<string>("balanced");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-calculate duration from dates
  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      if (e >= s) {
        const diff = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setDurationDays(diff);
      }
    }
  };

  const handlePlanTrip = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!origin.trim()) {
      setValidationError("Please enter your departure / starting location.");
      return;
    }

    setIsSubmitting(true);

    const destClean = destination.trim().toLowerCase() === "anywhere" ? "" : destination.trim();

    const query = new URLSearchParams({
      origin: origin.trim(),
      destination: destClean,
      startDate,
      endDate,
      duration: durationDays.toString(),
      budget: budget.replace(/[^0-9]/g, "") || "25000",
      currency,
      travellers: travellerCount.toString(),
      travellerType,
      travelPace,
      style: travelStyle,
    });

    // If destination is empty or 'Anywhere', user can either go to discovery or new trip
    if (!destClean) {
      router.push(`/trips/new?${query.toString()}`);
    } else {
      router.push(`/trips/new?${query.toString()}`);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-slate-950/75 backdrop-blur-xl border border-white/20 rounded-3xl p-5 sm:p-7 shadow-2xl text-left transition-all">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-medium text-base sm:text-lg">
                Intelligent Trip Planner
              </h3>
              <p className="text-xs text-slate-300">
                AI synthesizes hotels, routes, transport, and day-by-day itineraries instantly
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70 font-medium">Currency:</span>
            <div className="inline-flex rounded-lg bg-white/10 p-0.5 border border-white/15">
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  currency === "INR"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                ₹ INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  currency === "USD"
                    ? "bg-white text-slate-950 shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                $ USD
              </button>
            </div>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium">
            {validationError}
          </div>
        )}

        <form onSubmit={handlePlanTrip} className="space-y-4">
          {/* Row 1: Starting Location & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Starting Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                Starting Location
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="e.g. Mumbai, Delhi, London..."
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-hidden focus:ring-2 focus:ring-white/40 transition-all"
                />
              </div>
            </div>

            {/* Destination / Anywhere */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  Destination
                </span>
                <button
                  type="button"
                  onClick={() => setDestination("Anywhere")}
                  className="text-[11px] text-amber-300 hover:text-amber-200 underline underline-offset-2"
                >
                  Explore Anywhere
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to? (e.g. Goa, Jaipur, or 'Anywhere')"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/40 focus:outline-hidden focus:ring-2 focus:ring-white/40 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Dates/Duration, Travellers, Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dates or Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Dates ({durationDays} Days)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange(e.target.value, endDate)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-white/40"
                />
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => handleDateChange(startDate, e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-white/40"
                />
              </div>
            </div>

            {/* Travellers & Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-violet-400" />
                Travellers & Companions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={travellerCount}
                  onChange={(e) => setTravellerCount(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-white/40 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value={1}>1 Traveller</option>
                  <option value={2}>2 Travellers</option>
                  <option value={3}>3 Travellers</option>
                  <option value={4}>4 Travellers</option>
                  <option value={6}>6+ Group</option>
                </select>

                <select
                  value={travellerType}
                  onChange={(e) => setTravellerType(e.target.value as TravellerType)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-2.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-white/40 [&>option]:bg-slate-900 [&>option]:text-white"
                >
                  <option value="solo">Solo</option>
                  <option value="couple">Couple</option>
                  <option value="friends">Friends</option>
                  <option value="family">Family</option>
                </select>
              </div>
            </div>

            {/* Budget */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Target Budget ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. 25000"
                  min={1000}
                  step={500}
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-white/40"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Travel Pace & Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Travel Pace
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["relaxed", "moderate", "fast-paced"] as TravelPace[]).map((pace) => (
                  <button
                    key={pace}
                    type="button"
                    onClick={() => setTravelPace(pace)}
                    className={`py-1.5 px-2 text-xs rounded-xl font-medium capitalize border transition-all ${
                      travelPace === pace
                        ? "bg-white text-slate-950 border-white shadow-xs"
                        : "bg-white/5 border-white/15 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {pace === "fast-paced" ? "Packed" : pace}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/90 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                Experience Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "balanced", label: "Balanced" },
                  { id: "luxury", label: "Luxury" },
                  { id: "adventure", label: "Adventure" },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setTravelStyle(style.id)}
                    className={`py-1.5 px-2 text-xs rounded-xl font-medium border transition-all ${
                      travelStyle === style.id
                        ? "bg-white text-slate-950 border-white shadow-xs"
                        : "bg-white/5 border-white/15 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-300 text-slate-950 font-bold text-sm sm:text-base tracking-wide shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950 transition-transform group-hover:rotate-12" />
              <span>✨ PLAN MY COMPLETE TRIP</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
