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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight">
                Rimjhim Roams
              </span>
              <span className="text-xs text-muted-foreground block -mt-1">
                Travel OS
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              Explore Catalog
            </Link>
            <Link
              href="/trips"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block"
            >
              My Trips
            </Link>
            <Button size="sm" asChild className="gap-2">
              <Link href="#discovery-planner">
                <Compass className="w-4 h-4" /> Find Where to Go
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 space-y-12">
        <section className="pt-16 pb-8 px-4 text-center max-w-5xl mx-auto space-y-6">
          <Badge variant="secondary" className="px-3 py-1 text-sm gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Production-Grade & Free-Tier Native
          </Badge>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            The AI-Powered{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
              Travel Operating System
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Don&apos;t know where to go? Tell us your departure city and budget cap.
            TripWise calculates real transit, lodging, and activities to discover
            every destination you can feasibly travel.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button size="lg" className="gap-2 shadow-lg" asChild>
              <Link href="#discovery-planner">
                <Compass className="w-5 h-5 text-amber-300" /> FIND WHERE I SHOULD GO
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/trips">View My Trips</Link>
            </Button>
          </div>
        </section>

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
