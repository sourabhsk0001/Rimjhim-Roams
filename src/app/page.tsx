import Link from "next/link";
import { Compass, Sparkles, MapPin } from "lucide-react";
import { LandingHero } from "@/components/landing/LandingHero";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BudgetDestinationSection } from "@/components/landing/BudgetDestinationSection";
import { CopilotShowcase } from "@/components/landing/CopilotShowcase";
import { TravelModes } from "@/components/landing/TravelModes";
import { HeroPlanningPanel } from "@/components/landing/HeroPlanningPanel";
import { FinalCta } from "@/components/landing/FinalCta";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 1. Full-screen Cinematic Hero with Uploaded Travel Video & Glass Navbar */}
      <LandingHero />

      {/* 2. Below the Hero Sections */}
      <main className="flex-1">
        {/* Section 1: Everything You Need for the Journey */}
        <FeatureGrid />

        {/* Section 2: How It Works (01, 02, 03) */}
        <HowItWorks />

        {/* Section 3: Budget → Destination */}
        <BudgetDestinationSection />

        {/* Section 4: AI Travel Copilot */}
        <CopilotShowcase />

        {/* Section 5: Travel Modes */}
        <TravelModes />

        {/* Section 6: Intelligent Trip Planner (Positioned at bottom of landing page to maximize hero video visual impact) */}
        <section
          id="planner-section"
          className="py-20 bg-slate-950 text-white relative overflow-hidden scroll-mt-12 border-t border-white/10"
        >
          {/* Subtle Ambient Radial Lighting */}
          <div
            className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs sm:text-sm font-medium mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Instant Autonomous Travel Synthesis</span>
              </div>
              <h2 className="font-instrument text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-2px] text-white">
                Plan Your Complete Journey
              </h2>
              <p className="font-sans text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto">
                Customize your departure, destination, budget, and travel style. TripWise AI generates your day-by-day itinerary instantly.
              </p>
            </div>

            {/* Embedded Planning Panel with backward-compatible id="hero-planner" */}
            <div id="hero-planner">
              <HeroPlanningPanel />
            </div>
          </div>
        </section>

        {/* Section 7: Final CTA */}
        <FinalCta />
      </main>

      {/* Editorial Footer */}
      <footer className="border-t border-slate-200/80 py-12 bg-white text-sm text-[hsl(215,25%,32%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-instrument text-2xl font-normal tracking-tight text-[#0f172a] leading-none">
                  TripWise AI
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">
                  Rimjhim Roams<sup className="text-[8px] font-sans">®</sup> Travel Operating System
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-600">
              <Link href="/explore" className="hover:text-black transition-colors">
                Explore Destinations
              </Link>
              <Link href="/trips" className="hover:text-black transition-colors">
                My Itineraries
              </Link>
              <Link href="/assistant" className="hover:text-black transition-colors">
                AI Copilot
              </Link>
              <Link href="/trips/new" className="hover:text-black transition-colors">
                Plan a Trip
              </Link>
              <Link href="/admin/knowledge" className="hover:text-black transition-colors">
                Knowledge RAG
              </Link>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              © {new Date().getFullYear()} Rimjhim Roams® / TripWise AI. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Minimalist Editorial Edition</span>
              <span>•</span>
              <span>Powered by Gemini & OpenStreetMap</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
