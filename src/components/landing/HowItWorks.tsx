"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sliders, Cpu, CheckCircle2 } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Tell Us Your Trip",
      subtitle: "Enter destination, budget, dates and preferences.",
      detail:
        "Input where you want to go (or let AI pick 'Anywhere'), your departure hub, travel dates, companion group, and target budget.",
      icon: Sliders,
    },
    {
      step: "02",
      title: "AI Builds Your Journey",
      subtitle:
        "TripWise plans transport, hotels, activities, routes, timing and budget.",
      detail:
        "Autonomous Gemini algorithms sequence daily visits, compute transit buffers, select verified hotels, and balance expenses with zero arithmetic drift.",
      icon: Cpu,
    },
    {
      step: "03",
      title: "Travel With Confidence",
      subtitle: "Manage your complete journey from one place.",
      detail:
        "Access live route maps, offline travel documents, weather forecasts, on-the-fly AI replanning, and group expense settlements.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-slate-800/40 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/15">
            <span>Simple 3-Step Process</span>
          </div>
          <h2 className="font-instrument text-4xl sm:text-5xl lg:text-6xl font-normal tracking-[-1.5px] text-white leading-tight mb-4">
            How It Works
          </h2>
          <p className="text-lg text-slate-300 font-normal leading-relaxed">
            Eliminate dozens of open tabs, spreadsheets, and conflicting reviews.
            TripWise transforms raw intentions into actionable itineraries in
            seconds.
          </p>
        </div>

        {/* 3 Step Editorial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative p-8 rounded-3xl bg-slate-950/60 border border-white/10 backdrop-blur-md hover:border-white/20 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-instrument text-4xl font-normal text-amber-200/90 tracking-tight">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5 text-amber-200" />
                    </div>
                  </div>

                  <h3 className="font-instrument text-2xl sm:text-3xl font-normal text-white mb-3">
                    {item.title}
                  </h3>

                  <p className="text-sm font-medium text-amber-100/90 mb-4 leading-relaxed">
                    {item.subtitle}
                  </p>

                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {item.detail}
                  </p>
                </div>

                <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Step {item.step} of 03</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400/80 group-hover:scale-150 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA link to hero planner */}
        <div className="mt-16 text-center">
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-slate-950 font-semibold text-sm hover:bg-slate-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shadow-lg"
          >
            <span>Start Step 01 Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
