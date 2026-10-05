"use client";

import React from "react";
import { DestinationDiscoveryWidget } from "@/components/discovery/destination-discovery-widget";
import { Info, Sparkles, TrendingUp } from "lucide-react";

export function BudgetDestinationSection() {
  return (
    <section id="discovery-section" className="py-24 bg-slate-50 border-t border-b border-slate-200/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart Budget Allocation</span>
          </div>

          <h2 className="font-instrument text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-1.5px] text-[#0f172a] leading-tight mb-4">
            Budget → Destination
          </h2>

          <p className="text-lg text-[hsl(215,25%,32%)] font-normal leading-relaxed">
            Don&apos;t know where to go? Simply set your budget, duration, departure
            hub, and interests. TripWise scans destinations and engineers a
            complete, financially feasible journey.
          </p>

          {/* Pricing Estimation Disclaimer */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-medium">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Note:</strong> All hotel, transport, food, and activity prices
              are estimated based on regional baseline averages, seasonality indices,
              and live road distances.
            </span>
          </div>
        </div>

        {/* Embedded Live Destination Discovery Widget */}
        <div className="max-w-5xl mx-auto">
          <DestinationDiscoveryWidget />
        </div>
      </div>
    </section>
  );
}
