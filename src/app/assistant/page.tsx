"use client";

import { Navigation } from "@/components/navigation";
import { CopilotChat } from "@/components/ai/CopilotChat";
import { Sparkles, ShieldCheck, Compass, CloudSun, MapPin, Calculator } from "lucide-react";

export default function GlobalAssistantPage() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Hero Banner */}
        <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Phase 9 AI Travel Copilot</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Intelligent Travel Copilot with Deterministic Grounding
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Powered by Google Gemini and backed by TripWise domain engines. The copilot never guesses
              travel math, route geometry, or opening hours—every calculation is verified by real backend tools.
            </p>
          </div>

          {/* Value Pillars */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Zero Math Drift</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Strict minor-unit ledger</p>
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
