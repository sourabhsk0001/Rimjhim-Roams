"use client";

import { Navigation } from "@/components/navigation";
import { CopilotChat } from "@/components/ai/CopilotChat";
import { Sparkles, ShieldCheck, Compass, CloudSun, MapPin, Calculator } from "lucide-react";

export default function GlobalAssistantPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6 animate-fade-rise">
        {/* Hero Banner */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-slate-700" />
              <span>AI Travel Copilot</span>
            </div>

            <h1 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a] leading-none">
              Intelligent Travel Copilot with Deterministic Grounding
            </h1>

            <p className="text-[17px] text-[hsl(215,25%,32%)] font-normal leading-relaxed mt-2">
              Powered by Google Gemini and backed by TripWise domain engines. The copilot never guesses
              travel math, route geometry, or opening hours—every calculation is verified by real backend tools.
            </p>
          </div>

          {/* Value Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-full bg-slate-100 text-slate-800">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#0f172a]">Zero Math Drift</h4>
                <p className="text-[11px] text-[hsl(215,25%,32%)] mt-0.5">Strict minor-unit ledger</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">OSRM Routing</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Real road distances</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <CloudSun className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Open-Meteo Weather</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Probabilistic forecasts</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Authorized Scopes</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Private user itineraries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Chat Console */}
        <CopilotChat />
      </main>
    </div>
  );
}
