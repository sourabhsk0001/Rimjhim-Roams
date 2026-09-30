"use client";

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
} from "lucide-react";
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
      if (sp.get("startDate")) setStartDate(sp.get("startDate")!);
      if (sp.get("endDate")) setEndDate(sp.get("endDate")!);
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
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="gap-1 text-muted-foreground">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="shadow-lg border-muted">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary text-sm font-semibold">
              <Compass className="w-4 h-4" />
              <span>Phase 1 Travel Architecture</span>
            </div>
            <CardTitle className="text-2xl">Plan a New Journey</CardTitle>
            <CardDescription>
              Configure origin, dates, budget, and travel preferences. If you
              leave the destination blank, the system marks it as &quot;destination
              discovery required&quot;.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Validation Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="success">
                  <CheckCircle className="w-4 h-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Trip saved successfully! Redirecting to your trips...
                  </AlertDescription>
                </Alert>
              )}

              {/* Geographic Origins & Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin" className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    Origin City / Departure Point *
                  </Label>
                  <Input
                    id="origin"
                    placeholder="e.g. New Delhi, India"
                    required
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-muted-foreground" />
                      Destination (Optional)
                    </span>
                    <Link
                      href="/#discovery-planner"
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Don&apos;t know? Find where to go →
                    </Link>
                  </Label>
                  <Input
                    id="destination"
                    placeholder="e.g. Goa, Jaipur, Darjeeling or leave blank"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Travel Dates & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    Start Date *
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    End Date *
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Duration (Days)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Budget & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    Total Estimated Budget *
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="travellerCount" className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Number of Travellers
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travellerType">Traveller Type</Label>
                  <select
                    id="travellerType"
                    value={travellerType}
                    onChange={(e) => setTravellerType(e.target.value as TravellerType)}
                    disabled={loading}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
                  >
                    <option value="solo">Solo Adventure</option>
                    <option value="couple">Couple / Romantic</option>
                    <option value="family">Family with Children</option>
                    <option value="friends">Group of Friends</option>
                    <option value="business">Business / Bleisure</option>
                  </select>
                </div>
              </div>

              {/* Travel Pace */}
              <div className="space-y-2">
                <Label>Travel Pace Preference</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: "relaxed",
                      title: "Relaxed",
                      desc: "1-2 activities/day, late mornings",
                    },
                    {
                      id: "moderate",
                      title: "Moderate",
                      desc: "Balanced sightseeing and leisure",
                    },
                    {
                      id: "fast-paced",
                      title: "Fast-Paced",
                      desc: "Pack in as many sights as possible",
                    },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTravelPace(p.id as TravelPace)}
                      className={`p-3 text-left rounded-lg border text-sm transition-colors ${
                        travelPace === p.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-input hover:bg-muted/50"
                      }`}
                    >
                      <div className="font-semibold">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferences & Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Preferences & Special Interests
                </Label>
                <Textarea
                  id="notes"
                  placeholder="e.g. Looking for authentic street food, coastal viewpoints, art galleries, and vegetarian dining options."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t pt-4">
              <Button variant="outline" type="button" asChild disabled={loading}>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" className="gap-2" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Saving Trip..." : "Create Itinerary Plan"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
