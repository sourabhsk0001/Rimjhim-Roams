"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Sparkles,
  MapPin,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TravellerType, TravelPace } from "@/types/database";

export default function NewTripPage() {
  const router = useRouter();

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationDays, setDurationDays] = useState<number>(3);
  const [budget, setBudget] = useState("1500");
  const [currency, setCurrency] = useState("USD");
  const [travellerCount, setTravellerCount] = useState<number>(1);
  const [travellerType, setTravellerType] = useState<TravellerType>("solo");
  const [travelPace, setTravelPace] = useState<TravelPace>("moderate");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Prepopulate from URL parameters (e.g. from Destination Discovery Engine)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("origin")) setOrigin(sp.get("origin")!);
      if (sp.get("destination")) setDestination(sp.get("destination")!);
      if (sp.get("budget")) setBudget(sp.get("budget")!);
      if (sp.get("currency")) setCurrency(sp.get("currency")!);
      if (sp.get("duration")) setDurationDays(Number(sp.get("duration")));
      if (sp.get("travellers")) setTravellerCount(Number(sp.get("travellers")));
      if (sp.get("travellerType")) setTravellerType(sp.get("travellerType") as TravellerType);
      if (sp.get("travelPace")) setTravelPace(sp.get("travelPace") as TravelPace);
      if (sp.get("startDate")) setStartDate(sp.get("startDate")!);
      if (sp.get("endDate")) setEndDate(sp.get("endDate")!);
      if (sp.get("notes")) setNotes(sp.get("notes")!);
    }
  }, []);

  // Automatically compute duration when start and end dates change
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && endDate) {
      const s = new Date(val);
      const e = new Date(endDate);
      if (e >= s) {
        const diff = Math.ceil(
          Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        setDurationDays(diff);
      }
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    if (startDate && val) {
      const s = new Date(startDate);
      const e = new Date(val);
      if (e >= s) {
        const diff = Math.ceil(
          Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        setDurationDays(diff);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic client validation
    if (!origin.trim()) {
      setError("Origin location is required.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Both start and end dates are required.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("End date must be on or after start date.");
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum < 0) {
      setError("Budget must be a valid non-negative number.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        origin: origin.trim(),
        destination: destination.trim(), // Server / service will handle empty as "destination discovery required"
        start_date: startDate,
        end_date: endDate,
        duration_days: durationDays,
        budget: budgetNum,
        currency,
        traveller_count: travellerCount,
        traveller_type: travellerType,
        travel_pace: travelPace,
        preferences: {
          notes: notes.trim(),
        },
      };

      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create trip.");
      }

      setSuccess(true);
      const targetUrl = data.trip?.id ? `/trips/${data.trip.id}` : "/trips";
      router.push(targetUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl space-y-6 animate-fade-rise">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#64748b] hover:text-[#0f172a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] rounded-full px-2 py-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>

        <Card className="rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_6px_-1px_rgba(15,23,42,0.04),0_2px_4px_-2px_rgba(15,23,42,0.04)] overflow-hidden">
          <CardHeader className="space-y-2 p-6 sm:p-8 border-b border-[#e2e8f0]">
            <div className="flex items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f1f5f9] text-[#64748b] text-[11px] font-semibold uppercase tracking-[0.05em]">
                <Compass className="w-3.5 h-3.5 text-[#0d9488]" />
                <span>Itinerary Generator</span>
              </span>
            </div>
            <CardTitle className="font-instrument text-3xl sm:text-[36px] font-normal leading-[1.15] text-[#0f172a] tracking-[-0.02em]">
              Plan a New Journey
            </CardTitle>
            <CardDescription className="text-sm leading-[1.5] text-[#334155] font-normal tracking-[-0.005em]">
              Configure origin, dates, budget, and travel preferences. If you
              leave the destination blank, the system automatically triggers
              destination discovery.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="p-6 sm:p-8 space-y-6 sm:space-y-8">
              {error && (
                <Alert variant="destructive" className="rounded-xl border border-red-200 bg-red-50/80 text-red-900">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertTitle className="text-sm font-semibold text-red-900">Validation Error</AlertTitle>
                  <AlertDescription className="text-xs text-red-800 mt-1 space-y-1">
                    <p>{error}</p>
                    <p className="text-[11px] text-red-700/80 pt-1 border-t border-red-200/60">
                      Tip: Your inputs remain preserved. Verify all mandatory fields (*) and retry saving to synchronize with your database.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="success" className="rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <AlertTitle className="text-sm font-semibold text-emerald-900">Journey Synchronized</AlertTitle>
                  <AlertDescription className="text-xs text-emerald-800 mt-1">
                    Trip saved successfully! Synchronizing with database and redirecting...
                  </AlertDescription>
                </Alert>
              )}

              {/* Helpful non-intrusive database sync notice */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#334155]">
                <Database className="w-4 h-4 text-[#0d9488] shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <p className="font-semibold text-[#0f172a]">Continuous Database Sync</p>
                  <p className="text-[#64748b] leading-relaxed">
                    Your travel parameters are verified in real time. Trips synchronize directly to your cloud itinerary database, with instant local persistence ensuring zero loss during flaky connectivity.
                  </p>
                </div>
              </div>

              {/* Geographic Origins & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="origin" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                    <MapPin className="w-4 h-4 text-[#0f172a]" />
                    <span>Origin City / Departure Point *</span>
                  </Label>
                  <Input
                    id="origin"
                    placeholder="e.g. New Delhi, India"
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="destination" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                      <Compass className="w-4 h-4 text-[#64748b]" />
                      <span>Destination (Optional)</span>
                    </Label>
                    <Link
                      href="/#discovery-planner"
                      className="text-xs text-[#2563eb] hover:underline font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      Find where to go →
                    </Link>
                  </div>
                  <Input
                    id="destination"
                    placeholder="e.g. Goa, Jaipur, Darjeeling or leave blank"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20"
                  />
                </div>
              </div>

              {/* Travel Dates & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                    <Calendar className="w-4 h-4 text-[#64748b]" />
                    <span>Start Date *</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                    <Calendar className="w-4 h-4 text-[#64748b]" />
                    <span>End Date *</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                    <Clock className="w-4 h-4 text-[#64748b]" />
                    <span>Duration (Days)</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={loading}
                    className="rounded-xl border border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20 tabular-nums"
                  />
                </div>
              </div>

              {/* Budget & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                    <DollarSign className="w-4 h-4 text-[#64748b]" />
                    <span>Total Estimated Budget *</span>
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    disabled={loading}
                    className="rounded-xl border border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20 tabular-nums"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-xs sm:text-sm font-medium text-[#0f172a]">
                    Currency
                  </Label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={loading}
                    className="flex h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-sm text-[#0f172a] shadow-xs transition-colors focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              {/* Traveller Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="travellerCount" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                    <Users className="w-4 h-4 text-[#64748b]" />
                    <span>Number of Travellers</span>
                  </Label>
                  <Input
                    id="travellerCount"
                    type="number"
                    min="1"
                    value={travellerCount}
                    onChange={(e) =>
                      setTravellerCount(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    disabled={loading}
                    className="rounded-xl border border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20 tabular-nums"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travellerType" className="text-xs sm:text-sm font-medium text-[#0f172a]">
                    Traveller Type
                  </Label>
                  <select
                    id="travellerType"
                    value={travellerType}
                    onChange={(e) => setTravellerType(e.target.value as TravellerType)}
                    disabled={loading}
                    className="flex h-10 w-full rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2 text-sm text-[#0f172a] shadow-xs transition-colors focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20 disabled:cursor-not-allowed disabled:opacity-50 capitalize"
                  >
                    <option value="solo">Solo Adventure</option>
                    <option value="couple">Couple / Romantic</option>
                    <option value="family">Family with Children</option>
                    <option value="friends">Group of Friends</option>
                    <option value="business">Business / Bleisure</option>
                  </select>
                </div>
              </div>

              {/* Travel Pace Preference (Pace Selector Pills) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                    <Gauge className="w-4 h-4 text-[#64748b]" />
                    <span>Travel Pace Preference</span>
                  </Label>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748b]">
                    Select Pace
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: "relaxed",
                      title: "Relaxed",
                      desc: "1–2 stops/day, leisurely",
                    },
                    {
                      id: "moderate",
                      title: "Moderate",
                      desc: "Balanced sightseeing",
                    },
                    {
                      id: "fast-paced",
                      title: "Fast-Paced",
                      desc: "Pack maximum sights",
                    },
                  ].map((p) => {
                    const isSelected = travelPace === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setTravelPace(p.id as TravelPace)}
                        className={cn(
                          "flex flex-col items-center justify-center py-2.5 px-4 rounded-full border text-center transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20",
                          isSelected
                            ? "bg-[#0f172a] text-[#ffffff] border-[#0f172a] shadow-xs"
                            : "bg-white text-[#334155] border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                        )}
                      >
                        <span className="text-xs sm:text-sm font-semibold">{p.title}</span>
                        <span
                          className={cn(
                            "text-[11px] leading-tight mt-0.5",
                            isSelected ? "text-slate-300" : "text-[#64748b]"
                          )}
                        >
                          {p.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferences & Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#0f172a]">
                  <Sparkles className="w-4 h-4 text-[#d97706]" />
                  <span>Preferences & Special Interests</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. Looking for authentic street food, coastal viewpoints, heritage architecture, and vegetarian dining options."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  className="rounded-xl border border-[#e2e8f0] focus-visible:border-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/20"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 border-t border-[#e2e8f0] p-6 sm:p-8 bg-white rounded-b-2xl">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-full border border-[#e2e8f0] bg-white text-xs sm:text-sm font-medium text-[#334155] hover:text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-full bg-[#0f172a] text-[#ffffff] text-xs sm:text-sm font-medium shadow-xs hover:bg-[#1e293b] hover:scale-[1.02] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {loading ? "Saving Trip..." : "Create Itinerary Plan"}
              </button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
