"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  Heart,
  Users,
  Home,
  PiggyBank,
  Crown,
  Compass,
  Coffee,
  ArrowRight,
} from "lucide-react";

interface TravelModeItem {
  id: string;
  title: string;
  tagline: string;
  icon: React.ElementType;
  travellerType: string;
  travelPace: string;
  style: string;
  highlights: string[];
}

const TRAVEL_MODES: TravelModeItem[] = [
  {
    id: "solo",
    title: "Solo",
    tagline: "Total freedom & mindful journeys",
    icon: User,
    travellerType: "solo",
    travelPace: "moderate",
    style: "balanced",
    highlights: ["Verified safe walking corridors", "Co-working friendly cafes", "Hostels & social stays"],
  },
  {
    id: "couple",
    title: "Couple",
    tagline: "Romantic escapes & secluded sunsets",
    icon: Heart,
    travellerType: "couple",
    travelPace: "relaxed",
    style: "luxury",
    highlights: ["Private candlelit dining", "Panoramic scenic viewpoints", "Boutique heritage suites"],
  },
  {
    id: "friends",
    title: "Friends",
    tagline: "Group thrill & effortless expense splits",
    icon: Users,
    travellerType: "friends",
    travelPace: "fast-paced",
    style: "adventure",
    highlights: ["Multi-person bill settlement", "Vibrant nightlife & cafes", "Group activities & sports"],
  },
  {
    id: "family",
    title: "Family",
    tagline: "Comfort, multi-gen pacing & safety",
    icon: Home,
    travellerType: "family",
    travelPace: "relaxed",
    style: "balanced",
    highlights: ["Child-friendly attractions", "Spacious private transport", "Medical & emergency safety"],
  },
  {
    id: "budget",
    title: "Budget",
    tagline: "Maximum discovery, minimal spend",
    icon: PiggyBank,
    travellerType: "solo",
    travelPace: "moderate",
    style: "balanced",
    highlights: ["Public transit & rail routing", "Free monument entry days", "Affordable local street food"],
  },
  {
    id: "luxury",
    title: "Luxury",
    tagline: "Palatial estates & white-glove service",
    icon: Crown,
    travellerType: "couple",
    travelPace: "relaxed",
    style: "luxury",
    highlights: ["5-star heritage palaces", "Chauffeur airport transfers", "Curated private tasting menus"],
  },
  {
    id: "adventure",
    title: "Adventure",
    tagline: "High-altitude trails & wild safaris",
    icon: Compass,
    travellerType: "friends",
    travelPace: "fast-paced",
    style: "adventure",
    highlights: ["Himalayan valley treks", "Wildlife tiger reserves", "Water sports & scuba diving"],
  },
  {
    id: "relaxed",
    title: "Relaxed",
    tagline: "Unhurried mornings & peaceful wellness",
    icon: Coffee,
    travellerType: "couple",
    travelPace: "relaxed",
    style: "balanced",
    highlights: ["Ayurvedic rejuvenation spas", "Backwater sunset cruises", "Slow tea garden walks"],
  },
];

export function TravelModes() {
  return (
    <section className="py-24 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-200/80 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Tailored for Every Journey</span>
          </div>
          <h2 className="font-instrument text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-1.5px] text-[#0f172a] leading-tight mb-4">
            Travel Modes Built for Your Style
          </h2>
          <p className="text-lg text-[hsl(215,25%,32%)] font-normal leading-relaxed">
            TripWise customizes activity dwell times, daily budget allocations,
            and transport pacing according to who you travel with.
          </p>
        </div>

        {/* 8 Modes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRAVEL_MODES.map((mode) => {
            const Icon = mode.icon;
            const planUrl = `/trips/new?travellerType=${mode.travellerType}&travelPace=${mode.travelPace}&style=${mode.style}`;
            return (
              <div
                key={mode.id}
                className="group p-6 rounded-3xl border border-slate-200/90 bg-white hover:border-black/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="font-instrument text-2xl font-normal text-[#0f172a] mb-1">
                    {mode.title}
                  </h3>

                  <p className="text-xs text-[hsl(215,25%,32%)] font-medium mb-4">
                    {mode.tagline}
                  </p>

                  <ul className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    {mode.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100">
                  <Link
                    href={planUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 group-hover:text-black"
                  >
                    <span>Plan {mode.title} Trip</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
