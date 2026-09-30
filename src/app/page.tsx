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
            <h2 className="text-3xl font-bold tracking-tight">
              Engineered with Modern Geo & AI Primitives
            </h2>
            <p className="text-muted-foreground mt-2">
              Zero paid API dependencies. Built completely on scalable free-tier
              infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <CardTitle>Gemini Intelligence</CardTitle>
                <CardDescription>
                  Multi-day itinerary synthesis with contextual day pacing,
                  budgeting, and local activity generation.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Generates structured JSON travel plans with validated geographic
                points and activity categories.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-2">
                  <Route className="w-6 h-6" />
                </div>
                <CardTitle>OSRM & Leaflet Maps</CardTitle>
                <CardDescription>
                  Geospatial routing and interactive maps with OpenStreetMap
                  tiles and turn-by-turn geometry.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Calculates travel distances and road routes between planned
                destinations with zero Google Maps API billing.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 mb-2">
                  <CloudSun className="w-6 h-6" />
                </div>
                <CardTitle>Open-Meteo Weather</CardTitle>
                <CardDescription>
                  Real-time forecasts and meteorological insights for every
                  itinerary stop.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Predicts precipitation risk and ambient temperatures so
                travelers pack and plan accurately.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Architecture Stack */}
        <section id="architecture" className="bg-muted/40 py-16 border-t border-b">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-2">
                Tech Stack
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight">
                Modular Free-Tier Architecture
              </h2>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Designed for high performance, edge compatibility, and seamless
                deployment to Vercel.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
              {[
                { name: "Next.js 14", desc: "App Router & SSR", icon: Zap },
                { name: "TypeScript", desc: "Type Safety", icon: ShieldCheck },
                { name: "Tailwind CSS", desc: "shadcn/ui design", icon: Sparkles },
                { name: "Supabase", desc: "PostGIS + pgvector", icon: Database },
                { name: "Leaflet & OSM", desc: "Open Maps", icon: MapPin },
                { name: "Open-Meteo", desc: "Free Weather", icon: CloudSun },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border bg-card flex flex-col items-center justify-center gap-2"
                >
                  <item.icon className="w-6 h-6 text-primary" />
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-card text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {new Date().getFullYear()} Rimjhim Roams. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span>Built with Next.js & Supabase</span>
            <span>•</span>
            <span>Vercel Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
