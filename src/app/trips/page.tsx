"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  ArrowRight,
  Search,
  Filter,
  Compass,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardSkeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TripRow } from "@/lib/services/trip-service";

export default function TripsPage() {
  const [allTrips, setAllTrips] = useState<TripRow[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<TripRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trips");
      if (!res.ok) {
        throw new Error("Unable to retrieve trip itineraries.");
      }
      const data = await res.json();
      const combined = [...(data.upcoming || []), ...(data.previous || [])];
      setAllTrips(combined);
      setFilteredTrips(combined);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading trips."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    let result = allTrips;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.origin.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    setFilteredTrips(result);
  }, [searchTerm, statusFilter, allTrips]);

  const activeCount = allTrips.filter(
    (t) => t.status === "in_progress" || t.status === "planning" || t.status === "confirmed"
  ).length;
  const completedCount = allTrips.filter((t) => t.status === "completed").length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans relative text-white">
      <Navigation />

      {/* 1. Cinematic Hero Banner with Enhanced Brightness & Vibrancy */}
      <section className="relative overflow-hidden bg-slate-950 text-white border-b border-white/15 py-14 sm:py-20">
        {/* Background Image: Antique world map with compass & pushpins - Enhanced */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 transform scale-105 transition-transform duration-1000 filter brightness-110 contrast-105 saturate-115"
          style={{ backgroundImage: "url('/images/my-trip.jpg')" }}
          role="img"
          aria-label="Vintage world map background with compass"
        />

        {/* Lighter, clearer cinematic gradient overlay for visible map details */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/55 to-slate-950/25 z-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/35 z-0" />

        {/* Ambient Warm Golden & Azure Lighting */}
        <div
          className="absolute -top-20 left-1/4 w-96 h-96 bg-amber-400/25 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 right-1/4 w-96 h-96 bg-sky-400/25 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs sm:text-sm font-medium backdrop-blur-md shadow-sm">
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Personal Travel Expedition Log</span>
              </div>

              <h1 className="font-instrument text-4xl sm:text-6xl md:text-7xl font-normal tracking-[-2px] text-white leading-tight drop-shadow-md">
                My Trips
              </h1>

              <p className="font-sans text-sm sm:text-base md:text-lg text-slate-100 max-w-xl leading-relaxed drop-shadow-sm">
                Browse, filter, and manage your complete travel itineraries, active explorations, and customized routes in one place.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/trips/new"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-slate-950 font-medium text-xs sm:text-sm shadow-xl hover:bg-slate-100 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  <span>Plan New Trip</span>
                </Link>

                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 text-white border border-white/25 font-medium text-xs sm:text-sm backdrop-blur-md transition-all cursor-pointer active:scale-95 shadow-lg"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Explore Destinations</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
              <div className="p-4 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/20 text-center min-w-[100px] sm:min-w-[120px] shadow-xl">
                <div className="font-instrument text-2xl sm:text-3xl font-normal text-amber-200">
                  {allTrips.length}
                </div>
                <div className="text-[11px] text-slate-300 uppercase tracking-wider mt-0.5 font-medium">
                  Total Trips
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/20 text-center min-w-[100px] sm:min-w-[120px] shadow-xl">
                <div className="font-instrument text-2xl sm:text-3xl font-normal text-sky-200">
                  {activeCount}
                </div>
                <div className="text-[11px] text-slate-300 uppercase tracking-wider mt-0.5 font-medium">
                  Active
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/20 text-center min-w-[100px] sm:min-w-[120px] shadow-xl">
                <div className="font-instrument text-2xl sm:text-3xl font-normal text-emerald-200">
                  {completedCount}
                </div>
                <div className="text-[11px] text-slate-300 uppercase tracking-wider mt-0.5 font-medium">
                  Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Area with Enhanced Pointing.jpg Background */}
      <div className="relative flex-1 min-h-[600px] bg-slate-950 text-white overflow-hidden">
        {/* Background Image: Airplane shadow flying across world map (Pointing.jpg) - Enhanced */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 filter brightness-115 contrast-105 saturate-115"
          style={{ backgroundImage: "url('/images/pointing.jpg')" }}
          role="img"
          aria-label="Airplane shadow flying over world map"
        />

        {/* Lighter, vibrant gradient overlay so map details, flight silhouette, and pins pop */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/30 to-slate-950/60 z-0" />

        {/* Ambient atmospheric glow accents */}
        <div
          className="absolute top-1/4 left-10 w-[500px] h-[500px] bg-amber-400/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-sky-400/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-fade-rise">
          {/* Search and Filters - Dark Glassmorphic with high contrast */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/80 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/25 shadow-2xl">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-3" />
              <Input
                placeholder="Search by origin or destination..."
                className="pl-9 rounded-full border-white/20 text-sm focus-visible:ring-amber-400 bg-slate-900/90 text-white placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-300" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-9 rounded-full border border-white/20 bg-slate-900/90 px-4 py-1 text-xs font-medium text-slate-200 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Statuses</option>
                <option value="planning" className="bg-slate-900 text-white">Planning</option>
                <option value="confirmed" className="bg-slate-900 text-white">Confirmed</option>
                <option value="in_progress" className="bg-slate-900 text-white">In Progress</option>
                <option value="completed" className="bg-slate-900 text-white">Completed</option>
                <option value="cancelled" className="bg-slate-900 text-white">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="bg-rose-950/80 border-rose-800 text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <AlertTitle>Error Loading Trips</AlertTitle>
              <AlertDescription className="mt-1">{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredTrips.length === 0 ? (
            /* Empty State - Dark Frosted Glass Card */
            <Card className="border border-white/15 p-12 text-center space-y-4 bg-slate-900/85 backdrop-blur-xl rounded-2xl shadow-2xl text-white">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 text-white mx-auto flex items-center justify-center shadow-lg">
                <Compass className="w-8 h-8 text-amber-300" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="font-instrument text-2xl font-normal text-white">No itineraries found</h3>
                <p className="text-sm text-slate-300">
                  {searchTerm || statusFilter !== "all"
                    ? "No trips matched your search or status filter. Try clearing your filters."
                    : "You haven't recorded any trips yet. Create your first journey to get started!"}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/trips/new"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-slate-950 hover:bg-slate-100 font-medium text-sm shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  <span>Create a Trip</span>
                </Link>
              </div>
            </Card>
          ) : (
            /* Grid of Trips - Dark Frosted Glass Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => {
                const isDiscovery =
                  trip.destination === "destination discovery required";

                return (
                  <div
                    key={trip.id}
                    className="flex flex-col h-full rounded-2xl border border-white/15 bg-slate-900/85 backdrop-blur-xl hover:border-white/30 hover:bg-slate-900/95 transition-all duration-300 p-6 space-y-4 group shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                          trip.status === "completed"
                            ? "bg-slate-800 text-slate-300 border-slate-700"
                            : isDiscovery
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-white text-slate-950 border-white"
                        }`}
                      >
                        {isDiscovery ? "Discovery Required" : trip.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {trip.duration_days}{" "}
                        {trip.duration_days === 1 ? "day" : "days"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-instrument text-2xl font-normal text-white line-clamp-1 group-hover:text-amber-200 transition-colors">
                        {isDiscovery
                          ? `Discovery from ${trip.origin}`
                          : `${trip.origin} → ${trip.destination}`}
                      </h3>
                      <p className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>Origin: {trip.origin}</span>
                      </p>
                    </div>

                    <div className="flex-1 space-y-2 text-xs text-slate-300 pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {trip.start_date} to {trip.end_date}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1 font-medium text-white">
                          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                          {trip.budget.toLocaleString()} {trip.currency}
                        </span>
                        <span className="capitalize text-slate-400">{trip.travel_pace} pace</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="inline-flex items-center justify-between w-full text-xs font-medium text-slate-200 hover:text-white transition-colors py-1 group/btn"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform text-amber-400" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
