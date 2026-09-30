"use client";

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

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6 animate-fade-rise">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a] leading-none">
              My Trips
            </h1>
            <p className="text-[17px] text-[hsl(215,25%,32%)] mt-2 font-normal">
              Browse, filter, and manage all your travel itineraries in one place.
            </p>
          </div>
          <Link
            href="/trips/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium shadow-sm hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200 w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            Plan New Trip
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              placeholder="Search by origin or destination..."
              className="pl-9 rounded-full border-slate-200 text-sm focus-visible:ring-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-9 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-medium text-slate-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black"
            >
              <option value="all">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
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
          /* Empty State */
          <Card className="border-dashed p-12 text-center space-y-4 bg-card/50">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Compass className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-semibold text-lg">No itineraries found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No trips matched your search or status filter. Try clearing your filters."
                  : "You haven't recorded any trips yet. Create your first journey to get started!"}
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/trips/new">
                <PlusCircle className="w-4 h-4" />
                Create a Trip
              </Link>
            </Button>
          </Card>
        ) : (
          /* Grid of Trips */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => {
              const isDiscovery =
                trip.destination === "destination discovery required";

              return (
                <div
                  key={trip.id}
                  className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white hover:shadow-md transition-all duration-300 p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        trip.status === "completed"
                          ? "bg-slate-100 text-slate-700"
                          : isDiscovery
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-black text-white"
                      }`}
                    >
                      {isDiscovery ? "Discovery Required" : trip.status}
                    </span>
                    <span className="text-xs font-medium text-[hsl(215,25%,32%)] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {trip.duration_days}{" "}
                      {trip.duration_days === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-instrument text-2xl font-normal text-[#0f172a] line-clamp-1">
                      {isDiscovery
                        ? `Discovery from ${trip.origin}`
                        : `${trip.origin} → ${trip.destination}`}
                    </h3>
                    <p className="flex items-center gap-1.5 text-xs text-[hsl(215,25%,32%)] mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Origin: {trip.origin}</span>
                    </p>
                  </div>

                  <div className="flex-1 space-y-2 text-xs text-[hsl(215,25%,32%)] pt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {trip.start_date} to {trip.end_date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-900">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {trip.budget.toLocaleString()} {trip.currency}
                      </span>
                      <span className="capitalize text-slate-600">{trip.travel_pace} pace</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="inline-flex items-center justify-between w-full text-xs font-medium text-black hover:text-slate-600 transition-colors py-1 group"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
