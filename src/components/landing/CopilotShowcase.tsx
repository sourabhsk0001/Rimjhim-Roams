"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  Zap,
  ShieldAlert,
} from "lucide-react";

export function CopilotShowcase() {
  const verifiedTools = [
    "replan_trip",
    "optimize_itinerary",
    "calculate_route",
    "calculate_budget",
    "get_weather",
    "search_attractions",
    "search_restaurants",
    "search_hotels",
  ];

  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Context & Product Capabilities */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Autonomous Agent</span>
            </div>

            <h2 className="font-instrument text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-1.5px] text-white leading-tight">
              AI Travel Copilot
            </h2>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              Travel plans change when flights delay, weather shifts, or energy
              wanes. The TripWise AI Copilot understands your exact trip context,
              budgets, and local geography to rebalance itineraries dynamically.
            </p>

            {/* Verified Tool Capabilities */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                12 Verified Agent Tools Wired In
              </div>
              <div className="flex flex-wrap gap-2">
                {verifiedTools.map((tool) => (
                  <span
                    key={tool}
                    className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-amber-200/90"
                  >
                    {tool}()
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/assistant"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                <span>Launch Travel Copilot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/trips"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-sm flex items-center justify-center gap-2 border border-white/15 transition-all"
              >
                <span>Select a Trip Context</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Realistic Copilot Dialog Mockup */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-slate-900/90 border border-white/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
              {/* Chat Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <Bot className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>TripWise Travel Copilot</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-xs text-slate-400">
                      Context: Day 2 in Udaipur • 3:15 PM
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-mono text-amber-300/80 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  Tool: replan_trip
                </span>
              </div>

              {/* Chat Messages */}
              <div className="space-y-6">
                {/* 1. User Message */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="max-w-md bg-white text-slate-950 rounded-2xl rounded-tr-xs p-4 text-sm font-medium shadow-sm">
                    I only have 3 hours left today. What should I visit?
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                </div>

                {/* 2. Copilot Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div className="space-y-4 max-w-xl">
                    <div className="bg-slate-800/90 border border-white/10 rounded-2xl rounded-tl-xs p-5 text-sm text-slate-100 leading-relaxed shadow-sm">
                      <p className="font-semibold text-amber-200 mb-2">
                        I&apos;ve optimized your remaining itinerary based on distance, opening hours and priority.
                      </p>
                      <p className="text-slate-300 text-xs sm:text-sm">
                        Since Monsoon Palace closes earlier and is 8.5 km away,
                        I reordered your schedule to keep you within the Old
                        City heritage core:
                      </p>

                      {/* Replanned Items Subcard */}
                      <div className="mt-4 space-y-2.5">
                        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-300" />
                            <span className="font-semibold text-white">
                              3:30 PM – 4:45 PM
                            </span>
                            <span className="text-slate-300">• City Palace Museum</span>
                          </div>
                          <span className="text-emerald-400 font-mono">
                            Open until 5:30 PM
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-300" />
                            <span className="font-semibold text-white">
                              5:00 PM – 6:15 PM
                            </span>
                            <span className="text-slate-300">
                              • Lake Pichola Sunset Boat
                            </span>
                          </div>
                          <span className="text-sky-300 font-mono">
                            Walking distance (400m)
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Saved 45 mins transit time
                        </span>
                        <span>0 scheduling conflicts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
