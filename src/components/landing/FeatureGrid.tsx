"use client";

import React from "react";
import Link from "next/link";
import {
  Compass,
  Calendar,
  DollarSign,
  Car,
  Bed,
  Utensils,
  CloudSun,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  link: string;
  linkText: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: "discovery",
    title: "Destination Discovery",
    description:
      "Find the ideal destination tailored to your exact budget, duration, departure hub, and seasonal weather.",
    icon: Compass,
    badge: "Budget-Driven",
    link: "#discovery-section",
    linkText: "Try Discovery",
  },
  {
    id: "itinerary",
    title: "Smart Itinerary",
    description:
      "AI-orchestrated daily sequencing with opening hours, dwell time optimization, and zero scheduling clashes.",
    icon: Calendar,
    badge: "Automated",
    link: "/trips/new",
    linkText: "Generate Plan",
  },
  {
    id: "budget",
    title: "Budget Intelligence",
    description:
      "Deterministic integer-arithmetic budget engine with daily breakdown across stays, transport, food, and activities.",
    icon: DollarSign,
    badge: "Exact Math",
    link: "/trips",
    linkText: "Manage Budgets",
  },
  {
    id: "transport",
    title: "Transport & Routing",
    description:
      "OpenStreetMap & OSRM road geometry calculation with multi-modal airport transfers, taxi tariffs, and transit routes.",
    icon: Car,
    badge: "Zero API Cost",
    link: "/explore",
    linkText: "View Routes",
  },
  {
    id: "hotels",
    title: "Hotels & Stays",
    description:
      "Curated boutique hotels, luxury resorts, and homestays filtered by verified guest ratings and distance to sights.",
    icon: Bed,
    badge: "Curated",
    link: "/explore",
    linkText: "Browse Stays",
  },
  {
    id: "restaurants",
    title: "Restaurants & Food",
    description:
      "Authentic regional dining spots, street food heritage lanes, and dietary preference filters synced to meal times.",
    icon: Utensils,
    badge: "Culinary",
    link: "/explore",
    linkText: "Explore Dining",
  },
  {
    id: "weather",
    title: "Weather-Aware Planning",
    description:
      "Meteorological forecasts via Open-Meteo with automatic rainy-day replanning and ambient climate alerts.",
    icon: CloudSun,
    badge: "Live Forecasts",
    link: "/trips",
    linkText: "Weather Check",
  },
  {
    id: "copilot",
    title: "AI Travel Copilot",
    description:
      "Gemini-powered conversational assistant that replans days, calculates live costs, and answers travel queries on the go.",
    icon: Sparkles,
    badge: "12 Tools",
    link: "/assistant",
    linkText: "Chat with Copilot",
  },
  {
    id: "safety",
    title: "Safety Center",
    description:
      "One-tap emergency SOS, local police and ambulance contacts, nearest 24/7 hospitals, and real-time travel advisories.",
    icon: ShieldCheck,
    badge: "24/7 Protection",
    link: "/trips",
    linkText: "Safety Hub",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Modular Travel OS</span>
          </div>
          <h2 className="font-instrument text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-1.5px] text-[#0f172a] leading-tight mb-4">
            Everything You Need for the Journey
          </h2>
          <p className="text-lg text-[hsl(215,25%,32%)] font-normal leading-relaxed">
            From preliminary daydreaming to on-the-ground itinerary shifts,
            TripWise AI integrates every travel primitive into a unified,
            autonomous system.
          </p>
        </div>

        {/* 9 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group p-8 rounded-3xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-slate-200/60 text-slate-700">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="font-instrument text-2xl font-normal text-[#0f172a] mb-2 tracking-tight">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-[hsl(215,25%,32%)] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60">
                  <Link
                    href={feature.link}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 group-hover:text-black hover:underline"
                  >
                    <span>{feature.linkText}</span>
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
