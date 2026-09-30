"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Wallet,
  Clock,
  CloudSun,
  MapPin,
  Sparkles,
  Bot,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { CopilotChat } from "@/components/ai/CopilotChat";
import { TripRow } from "@/lib/services/trip-service";

export default function TripAssistantPage() {
  const params = useParams();
  const tripId = params.id as string;
  const router = useRouter();

  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrip() {
      try {
        setLoading(true);
        const res = await fetch(`/api/trips/${tripId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load trip.");
        }
        setTrip(data.trip);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Trip not found");
      } finally {
        setLoading(false);
      }
    }

    if (tripId) {
      loadTrip();
    }
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col">
        <Navigation />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Trip Copilot...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-muted/20 flex flex-col">
        <Navigation />
        <div className="flex-1 container mx-auto px-4 py-12 max-w-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Unable to load trip</h2>
          <p className="text-sm text-muted-foreground">{error || "Trip not found"}</p>
          <Button asChild variant="outline">
            <Link href="/trips">Return to My Trips</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Navigation & Context Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
            <Link href={`/trips/${trip.id}`}>
              <ArrowLeft className="w-4 h-4" /> Back to Trip Details
            </Link>
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" asChild variant="outline" className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50">
              <Link href={`/trips/${trip.id}/itinerary`}>
                <Clock className="w-4 h-4" />
                Itinerary
              </Link>
            </Button>

            <Button size="sm" asChild variant="outline" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <Link href={`/trips/${trip.id}/budget`}>
                <Wallet className="w-4 h-4" />
                Budget
              </Link>
            </Button>

            <Button size="sm" asChild variant="outline" className="gap-1.5 border-sky-300 text-sky-700 hover:bg-sky-50">
              <Link href={`/trips/${trip.id}/weather`}>
                <CloudSun className="w-4 h-4" />
                Weather
              </Link>
            </Button>
          </div>
        </div>

        {/* Trip Context Card */}
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Active Itinerary Mode
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                ID: {trip.id.substring(0, 8)}...
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {trip.origin} → {trip.destination}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{trip.duration_days} Days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>₹{trip.budget.toLocaleString()} ({trip.currency})</span>
            </div>
            <div className="capitalize px-2.5 py-1 rounded bg-muted font-medium text-foreground">
              {trip.travel_pace} Pace
            </div>
          </div>
        </div>

        {/* Reusable Copilot Chat with Hydrated Trip Context */}
        <CopilotChat
          tripId={trip.id}
          tripSummary={{
            origin: trip.origin,
            destination: trip.destination,
            durationDays: trip.duration_days,
            budget: trip.budget,
            currency: trip.currency,
          }}
        />
      </main>
    </div>
  );
}
