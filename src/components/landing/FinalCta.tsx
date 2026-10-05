"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles, MapPin } from "lucide-react";

export function FinalCta() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-slate-950 text-white overflow-hidden p-8 sm:p-12 md:p-16 lg:p-20 shadow-2xl border border-white/10 text-center">
          {/* Ambient Lighting Gradients */}
          <div
            className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs sm:text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Begin Your Autonomous Travel Experience</span>
            </div>

            <h2 className="font-instrument text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-[-2px] text-white leading-tight">
              Your Next Journey Starts Here.
            </h2>

            <p className="font-sans text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Let TripWise AI handle the planning while you enjoy the journey.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/trips/new"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-bold text-sm sm:text-base tracking-wide shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>PLAN MY COMPLETE TRIP</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/explore"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm sm:text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-sky-300" />
                <span>Explore India Knowledge Base</span>
              </Link>
            </div>

            <div className="pt-8 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-6">
              <span>✓ No credit card required</span>
              <span>✓ Free Gemini intelligence</span>
              <span>✓ Instant export to offline itineraries</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
