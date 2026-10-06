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
import { PersonalizedRecommendations } from "@/components/tourism/PersonalizedRecommendations";
import { OnboardingPanel } from "@/components/tourism/OnboardingPanel";

export default function DashboardPage() {
  const [upcoming, setUpcoming] = useState<TripRow[]>([]);
  const [previous, setPrevious] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("onboarding") === "true") {
        setShowOnboarding(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8 animate-fade-rise">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a] leading-none">
              Travel Dashboard
            </h1>
            <p className="text-[17px] text-[hsl(215,25%,32%)] mt-2 font-normal">
              Manage your itineraries, explore destinations, and plan your next journey.
            </p>
          </div>
          <Link
            href="/trips/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium shadow-sm hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200 w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            Create Trip
          </Link>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <span className="text-xs uppercase font-medium tracking-wider text-[hsl(215,25%,32%)]">Upcoming Journeys</span>
                <div className="font-instrument text-4xl font-normal text-[#0f172a] mt-2">
                  {upcoming.length}
                </div>
                <p className="text-xs text-[hsl(215,25%,32%)] mt-1">
                  Trips scheduled for departure
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <span className="text-xs uppercase font-medium tracking-wider text-[hsl(215,25%,32%)]">Past Adventures</span>
                <div className="font-instrument text-4xl font-normal text-[#0f172a] mt-2">
                  {previous.length}
                </div>
                <p className="text-xs text-[hsl(215,25%,32%)] mt-1">
                  Completed itineraries recorded
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <span className="text-xs uppercase font-medium tracking-wider text-[hsl(215,25%,32%)]">Total Itineraries</span>
                <div className="font-instrument text-4xl font-normal text-[#0f172a] mt-2">
                  {upcoming.length + previous.length}
                </div>
                <p className="text-xs text-[hsl(215,25%,32%)] mt-1">
                  Overall journey portfolio
                </p>
              </div>
            </div>

            {/* Personalized Recommendations Section (NATMO Circuits & Preference Engine) */}
            <PersonalizedRecommendations />

            {/* Upcoming Trips Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-instrument text-3xl font-normal tracking-tight text-[#0f172a] flex items-center gap-2.5">
                  <PlaneTakeoff className="w-5 h-5 text-slate-700" />
                  Upcoming Trips
                </h2>
                {upcoming.length > 0 && (
                  <Link
                    href="/trips"
                    className="text-xs font-medium text-[hsl(215,25%,32%)] hover:text-[#0f172a] hover:underline"
                  >
                    View all trips →
                  </Link>
                )}
              </div>

              {upcoming.length === 0 ? (
                /* Empty State */
                <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-4 bg-white/50">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-800 mx-auto flex items-center justify-center">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-instrument text-2xl text-[#0f172a]">No upcoming trips</h3>
                    <p className="text-sm text-[hsl(215,25%,32%)]">
                      You haven&apos;t scheduled any upcoming adventures yet. Begin
                      by creating your first travel itinerary.
                    </p>
                  </div>
                  <Link
                    href="/trips/new"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium shadow-xs hover:scale-[1.03] transition-transform duration-200"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Plan Your Next Trip
                  </Link>
                </div>
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
                <h2 className="font-instrument text-3xl font-normal tracking-tight text-[#0f172a] flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-slate-500" />
                  Previous Trips
                </h2>
              </div>

              {previous.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-white/50">
                  <p className="text-sm text-[hsl(215,25%,32%)]">
                    No completed trips recorded yet.
                  </p>
                </div>
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

      <OnboardingPanel
        isOpen={showOnboarding}
        isModal={true}
        onClose={() => setShowOnboarding(false)}
        onSaved={() => setShowOnboarding(false)}
      />
    </div>
  );
}

function TripCard({ trip, isPast }: { trip: TripRow; isPast?: boolean }) {
  const isDiscovery = trip.destination === "destination discovery required";

  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white hover:shadow-md transition-all duration-300 p-6 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            isPast
              ? "bg-slate-100 text-slate-700"
              : isDiscovery
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-black text-white"
          }`}
        >
          {isPast ? "Completed" : isDiscovery ? "Discovery Required" : trip.status}
        </span>
        <span className="text-xs font-medium text-[hsl(215,25%,32%)] flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {trip.duration_days} {trip.duration_days === 1 ? "day" : "days"}
        </span>
      </div>

      <div>
        <h3 className="font-instrument text-2xl font-normal text-[#0f172a] line-clamp-1">
          {trip.destination === "destination discovery required"
            ? `From ${trip.origin}`
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
          <span>View Itinerary Details</span>
          <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
