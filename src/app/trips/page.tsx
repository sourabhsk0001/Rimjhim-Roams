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
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Trips</h1>
            <p className="text-muted-foreground mt-1">
              Browse, filter, and manage all your travel itineraries in one place.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 shadow">
            <Link href="/trips/new">
              <PlusCircle className="w-5 h-5" />
              Plan New Trip
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search by origin or destination..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                <Card
                  key={trip.id}
                  className="flex flex-col h-full hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant={
                          trip.status === "completed"
                            ? "secondary"
                            : isDiscovery
                            ? "outline"
                            : "default"
                        }
                      >
                        {isDiscovery ? "Discovery Required" : trip.status}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {trip.duration_days}{" "}
                        {trip.duration_days === 1 ? "day" : "days"}
                      </span>
                    </div>

                    <CardTitle className="text-lg mt-2 line-clamp-1">
                      {isDiscovery
                        ? `Discovery from ${trip.origin}`
                        : `${trip.origin} → ${trip.destination}`}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Origin: {trip.origin}</span>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {trip.start_date} to {trip.end_date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        {trip.budget.toLocaleString()} {trip.currency}
                      </span>
                      <span className="capitalize">{trip.travel_pace} pace</span>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="w-full justify-between"
                    >
                      <Link href={`/trips/${trip.id}`}>
                        View Details
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
