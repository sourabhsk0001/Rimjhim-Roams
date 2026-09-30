"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Users,
  Compass,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
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

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadTrip() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/${tripId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load trip details.");
        }
        setTrip(data.trip);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading trip details."
        );
      } finally {
        setLoading(false);
      }
    }

    if (tripId) {
      loadTrip();
    }
  }, [tripId]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trip itinerary?")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete trip.");
      }
      router.push("/trips");
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting trip.");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
            <Link href="/trips">
              <ArrowLeft className="w-4 h-4" /> Back to My Trips
            </Link>
          </Button>

          {trip && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:bg-destructive/10 border-destructive/30 gap-1.5"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Trip
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading itinerary details...</p>
          </div>
        ) : !trip ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground">Trip not found or unauthorized.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="shadow-lg border-muted">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="outline" className="mb-2 uppercase tracking-wide">
                      {trip.status}
                    </Badge>
                    <CardTitle className="text-3xl font-bold tracking-tight">
                      {trip.destination === "destination discovery required"
                        ? `Discovery from ${trip.origin}`
                        : `${trip.origin} → ${trip.destination}`}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Departure Location: <strong>{trip.origin}</strong></span>
                    </CardDescription>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">
                      {trip.budget.toLocaleString()} {trip.currency}
                    </div>
                    <div className="text-xs text-muted-foreground">Allocated Budget</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 border-t pt-6">
                {/* Highlights Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Start Date
                    </span>
                    <p className="font-semibold text-sm">{trip.start_date}</p>
                  </div>

                  <div className="p-4 rounded-xl border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> End Date
                    </span>
                    <p className="font-semibold text-sm">{trip.end_date}</p>
                  </div>

                  <div className="p-4 rounded-xl border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Duration
                    </span>
                    <p className="font-semibold text-sm">
                      {trip.duration_days} {trip.duration_days === 1 ? "Day" : "Days"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border bg-card space-y-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Group Size
                    </span>
                    <p className="font-semibold text-sm capitalize">
                      {trip.traveller_count} ({trip.traveller_type})
                    </p>
                  </div>
                </div>

                {/* Travel Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Compass className="w-4 h-4 text-primary" />
                      Trip Configuration
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b">
                        <span className="text-muted-foreground">Pace Preference</span>
                        <span className="font-medium capitalize">{trip.travel_pace}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b">
                        <span className="text-muted-foreground">Traveller Category</span>
                        <span className="font-medium capitalize">{trip.traveller_type}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b">
                        <span className="text-muted-foreground">Target Destination</span>
                        <span className="font-medium">
                          {trip.destination === "destination discovery required" ? (
                            <Badge variant="secondary">Discovery Required</Badge>
                          ) : (
                            trip.destination
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Preferences & Notes
                    </h3>
                    <div className="p-4 rounded-xl bg-muted/40 text-sm text-muted-foreground min-h-[90px]">
                      {typeof trip.preferences === "object" &&
                      trip.preferences !== null &&
                      "notes" in trip.preferences &&
                      Boolean(
                        (trip.preferences as Record<string, unknown>).notes
                      ) ? (
                        <p>{String((trip.preferences as Record<string, unknown>).notes)}</p>
                      ) : (
                        <p className="italic">No custom preferences or notes specified.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/10 border-t py-4 text-xs text-muted-foreground flex justify-between">
                <span>Created: {new Date(trip.created_at).toLocaleDateString()}</span>
                <span>ID: {trip.id}</span>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
