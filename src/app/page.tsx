import Link from "next/link";
import {
  Compass,
  MapPin,
  Sparkles,
  CloudSun,
  Route,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DestinationDiscoveryWidget } from "@/components/discovery/destination-discovery-widget";

import { CinematicHero } from "@/components/hero/cinematic-hero";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Editorial Cinematic Hero with Video Background & 3-Column Nav */}
      <CinematicHero />

      {/* Main Content */}
      <main className="flex-1 space-y-16 py-12">

        {/* Phase 7: Destination Discovery Interactive Planner Section */}
        <section className="container mx-auto px-4 max-w-6xl">
          <DestinationDiscoveryWidget />
        </section>

        {/* Feature Grid */}
        <section id="features" className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a]">
              Engineered with Modern Geo & AI Primitives
            </h2>
            <p className="text-lg text-[hsl(215,25%,32%)] font-normal mt-2">
              Zero paid API dependencies. Built completely on scalable free-tier
              infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <CardTitle className="font-instrument text-2xl font-normal text-[#0f172a]">Gemini Intelligence</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,25%,32%)]">
                  Multi-day itinerary synthesis with contextual day pacing,
                  budgeting, and local activity generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Generates structured JSON travel plans with validated geographic
                points and activity categories.
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white mb-2">
                  <Route className="w-6 h-6" />
                </div>
                <CardTitle className="font-instrument text-2xl font-normal text-[#0f172a]">OSRM & Leaflet Maps</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,25%,32%)]">
                  Geospatial routing and interactive maps with OpenStreetMap
                  tiles and turn-by-turn geometry.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Calculates travel distances and road routes between planned
                destinations with zero Google Maps API billing.
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white mb-2">
                  <CloudSun className="w-6 h-6" />
                </div>
                <CardTitle className="font-instrument text-2xl font-normal text-[#0f172a]">Open-Meteo Weather</CardTitle>
                <CardDescription className="text-sm text-[hsl(215,25%,32%)]">
                  Real-time forecasts and meteorological insights for every
                  itinerary stop.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">
                Predicts precipitation risk and ambient temperatures so
                travelers pack and plan accurately.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Architecture Stack */}
        <section id="architecture" className="bg-slate-50/70 py-16 border-t border-b border-slate-200/80">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-2 rounded-full px-3 py-1 text-xs">
                Tech Stack
              </Badge>
              <h2 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a]">
                Modular Free-Tier Architecture
              </h2>
              <p className="text-lg text-[hsl(215,25%,32%)] font-normal mt-2 max-w-2xl mx-auto">
                Designed for high performance, edge compatibility, and seamless
                deployment to Vercel.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
              {[
                { name: "Next.js 14", desc: "App Router & SSR", icon: Zap },
                { name: "TypeScript", desc: "Type Safety", icon: ShieldCheck },
                { name: "Tailwind CSS", desc: "Minimalist Editorial", icon: Sparkles },
                { name: "Supabase", desc: "PostGIS + pgvector", icon: Database },
                { name: "Leaflet & OSM", desc: "Open Maps", icon: MapPin },
                { name: "Open-Meteo", desc: "Free Weather", icon: CloudSun },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col items-center justify-center gap-2 hover:scale-[1.03] transition-transform"
                >
                  <item.icon className="w-6 h-6 text-slate-800" />
                  <div className="font-semibold text-sm text-[#0f172a]">{item.name}</div>
                  <div className="text-xs text-[hsl(215,25%,32%)]">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-10 bg-white text-center text-sm text-[hsl(215,25%,32%)]">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-instrument text-2xl font-normal tracking-[-0.5px] text-[#0f172a]">
              Rimjhim Roams<sup className="text-[10px] font-sans font-normal ml-0.5 text-slate-500">®</sup>
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div className="flex gap-4 text-xs">
            <span>Built with Next.js & Supabase</span>
            <span>•</span>
            <span>Minimalist Editorial Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
