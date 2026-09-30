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
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
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
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl space-y-6 animate-fade-rise">
        {/* Navigation & Context Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(215,25%,32%)] hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Trip Details
          </Link>
        </div>

        {/* Unified Module Nav */}
        <TripWorkspaceNav tripId={trip.id} />

        {/* Trip Context Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Active Itinerary Mode
              </span>
              <span className="text-[11px] text-[hsl(215,25%,32%)] font-mono">
                ID: {trip.id.substring(0, 8)}...
              </span>
            </div>
            <h1 className="font-instrument text-3xl sm:text-4xl font-normal tracking-tight text-[#0f172a] flex items-center gap-2 mt-1">
              <MapPin className="w-5 h-5 text-slate-700" />
              {trip.origin} → {trip.destination}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[hsl(215,25%,32%)]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{trip.duration_days} Days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              <span>₹{trip.budget.toLocaleString()} ({trip.currency})</span>
            </div>
            <div className="capitalize px-3 py-1 rounded-full bg-slate-100 font-medium text-slate-900 border border-slate-200">
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
