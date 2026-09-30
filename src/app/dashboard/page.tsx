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
  PlaneTakeoff,
  Compass,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
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

export default function DashboardPage() {
  const [upcoming, setUpcoming] = useState<TripRow[]>([]);
  const [previous, setPrevious] = useState<TripRow[]>([]);
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
      setUpcoming(data.upcoming || []);
      setPrevious(data.previous || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Travel Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your itineraries, explore destinations, and plan your next journey.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2 shadow">
            <Link href="/trips/new">
              <PlusCircle className="w-5 h-5" />
              Create Trip
            </Link>
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription className="flex items-center justify-between mt-2">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTrips}
                className="gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="space-y-4 pt-4">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Upcoming Journeys</CardDescription>
                  <CardTitle className="text-3xl font-bold text-primary">
                    {upcoming.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Trips scheduled for departure
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Past Adventures</CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {previous.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Completed itineraries recorded
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Itineraries</CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {upcoming.length + previous.length}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Overall journey portfolio
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Trips Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <PlaneTakeoff className="w-5 h-5 text-primary" />
                  Upcoming Trips
                </h2>
                {upcoming.length > 0 && (
                  <Link
                    href="/trips"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View all
                  </Link>
                )}
              </div>

              {upcoming.length === 0 ? (
                /* Empty State */
                <Card className="border-dashed p-8 text-center space-y-4 bg-card/50">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-semibold text-lg">No upcoming trips</h3>
                    <p className="text-sm text-muted-foreground">
                      You haven&apos;t scheduled any upcoming adventures yet. Begin
                      by creating your first travel itinerary!
                    </p>
                  </div>
                  <Button asChild className="gap-2">
                    <Link href="/trips/new">
                      <PlusCircle className="w-4 h-4" />
                      Plan Your Next Trip
                    </Link>
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>

            {/* Previous Trips Section */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  Previous Trips
                </h2>
              </div>

              {previous.length === 0 ? (
                <Card className="border-dashed p-6 text-center bg-card/50">
                  <p className="text-sm text-muted-foreground">
                    No completed trips recorded yet.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {previous.map((trip) => (
                    <TripCard key={trip.id} trip={trip} isPast />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function TripCard({ trip, isPast }: { trip: TripRow; isPast?: boolean }) {
  const isDiscovery = trip.destination === "destination discovery required";

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant={
              isPast
                ? "secondary"
                : isDiscovery
                ? "outline"
                : "default"
            }
          >
            {isPast ? "Completed" : isDiscovery ? "Discovery Required" : trip.status}
          </Badge>
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {trip.duration_days} {trip.duration_days === 1 ? "day" : "days"}
          </span>
        </div>

        <CardTitle className="text-lg mt-2 line-clamp-1">
          {trip.destination === "destination discovery required"
            ? `From ${trip.origin}`
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
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {trip.budget.toLocaleString()} {trip.currency}
          </span>
          <span className="capitalize">{trip.travel_pace} pace</span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 border-t">
        <Button variant="ghost" size="sm" asChild className="w-full justify-between">
          <Link href={`/trips/${trip.id}`}>
            View Itinerary Details
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
