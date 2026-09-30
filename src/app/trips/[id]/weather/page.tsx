"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Compass,
  Wallet,
  Umbrella,
  Thermometer,
  ShieldCheck,
  Eye,
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
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
import { useToast } from "@/components/ui/toast";
import {
  WeatherForecastResponse,
  WeatherSnapshot,
  WeatherConflictResolution,
  HourlyWeather,
  DailyWeather,
} from "@/types/weather";

export default function TripWeatherPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const { toast } = useToast();

  const [weather, setWeather] = useState<WeatherForecastResponse | null>(null);
  const [snapshots, setSnapshots] = useState<WeatherSnapshot[]>([]);
  const [conflicts, setConflicts] = useState<WeatherConflictResolution[]>([]);
  const [locationName, setLocationName] = useState<string>("Destination");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected day for hourly breakdown
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Application state for weather optimization
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/weather`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load weather forecast.");
      }

      setWeather(data.weather);
      setSnapshots(data.snapshots || []);
      setConflicts(data.conflicts || []);
      if (data.locationName) setLocationName(data.locationName);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // Filter hourly weather for the selected day
  const selectedDayHourly = useMemo(() => {
    if (!weather || !weather.daily[selectedDayIndex]) return [];
    const dateStr = weather.daily[selectedDayIndex].date;
    const matching = weather.hourly.filter((h) => h.time.startsWith(dateStr));
    if (matching.length > 0) return matching;

    // Fallback: slice 24 hours per day
    const start = selectedDayIndex * 24;
    return weather.hourly.slice(start, start + 24);
  }, [weather, selectedDayIndex]);

  // Handle applying weather recommendations
  const handleApplyResolutions = async () => {
    setIsApplying(true);
    setApplySuccess(false);
    try {
      const res = await fetch(`/api/trips/${tripId}/weather/integrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, resolutions: conflicts }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to apply weather resolutions.");
      }
      setApplySuccess(true);
      // Refresh weather & conflicts
      await fetchWeatherData();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to apply weather optimizations."
      );
    } finally {
      setIsApplying(false);
    }
  };

  const getWeatherIcon = (condition: string, isRainy?: boolean) => {
    const c = (condition || "").toLowerCase();
    if (c.includes("rain") || isRainy) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    }
    if (c.includes("cloud")) {
      return <CloudSun className="w-8 h-8 text-amber-500" />;
    }
    if (c.includes("storm") || c.includes("thunder")) {
      return <CloudRain className="w-8 h-8 text-purple-600" />;
    }
    return <Sun className="w-8 h-8 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-rise">
        {/* Navigation & Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(215,25%,32%)] hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Trip Overview
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/trips/${tripId}/itinerary`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:scale-[1.03] transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Time & Itinerary
            </Link>

            <Link
              href={`/trips/${tripId}/budget`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:scale-[1.03] transition-all"
            >
              <Wallet className="w-3.5 h-3.5 text-slate-500" />
              Budget & Ledger
            </Link>

            <button
              type="button"
              onClick={async () => {
                await fetchWeatherData();
                toast({
                  title: "Weather Synchronized",
                  description: "Forecast refreshed from Open-Meteo.",
                  type: "info",
                });
              }}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-medium text-slate-900 shadow-xs hover:bg-slate-50 hover:scale-[1.03] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Unified Module Nav */}
        <TripWorkspaceNav tripId={tripId} />

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Weather Service Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {applySuccess && (
          <Alert className="bg-emerald-50 border-emerald-300 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <AlertTitle>Itinerary Updated Successfully</AlertTitle>
            <AlertDescription className="text-emerald-800">
              Weather optimizations applied! Sights were rescheduled to dry time windows or swapped with indoor cultural attractions.
              <span className="block mt-1">
                <Link href={`/trips/${tripId}/itinerary`} className="underline font-semibold">
                  Inspect updated itinerary &rarr;
                </Link>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Fetching meteorological atmospheric models from Open-Meteo...
            </p>
          </div>
        ) : weather ? (
          <>
            {/* Current Weather Hero Banner */}
            <Card className="overflow-hidden border-sky-200 shadow-md bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-300 gap-1 text-xs">
                        <MapPin className="w-3 h-3" />
                        {locationName}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {weather.provider}
                      </Badge>
                      {weather.isCached && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Cached Snapshot
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      {weather.current.temperature}°C
                    </h1>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-2">
                      {weather.current.condition}
                      <span className="text-xs text-muted-foreground font-normal">
                        (Feels like {weather.current.apparentTemperature}°C)
                      </span>
                    </p>
                  </div>

                  {/* Right side summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-sky-100 dark:border-slate-800 text-center">
                      <div className="flex items-center justify-center text-blue-500 mb-1">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-muted-foreground">Rain Chance</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {weather.daily[0]?.precipitationProbability ?? 0}%
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-sky-100 dark:border-slate-800 text-center">
                      <div className="flex items-center justify-center text-cyan-600 mb-1">
                        <Wind className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-muted-foreground">Wind Speed</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {weather.current.windSpeed} km/h
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-sky-100 dark:border-slate-800 text-center">
                      <div className="flex items-center justify-center text-indigo-500 mb-1">
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-muted-foreground">Humidity</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {weather.current.humidity}%
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-sky-100 dark:border-slate-800 text-center">
                      <div className="flex items-center justify-center text-amber-500 mb-1">
                        <Sun className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-muted-foreground">UV Index</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {weather.current.uvIndex}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety & Uncertainty Disclaimer */}
                <div className="mt-6 pt-4 border-t border-sky-200/50 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-slate-800 dark:text-slate-200">Weather Advisory & Accuracy Guard: </strong>
                    Atmospheric forecasts beyond 3 days represent ensemble probability guidance. For nautical, high-altitude trekking, or emergency conditions, verify live civil ranger alerts.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Weather-Itinerary Intelligence & Conflict Shield */}
            <Card className="border-amber-200 shadow-sm overflow-hidden bg-amber-50/30 dark:bg-amber-950/10">
              <CardHeader className="pb-3 border-b border-amber-200/60">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-700">
                      <Umbrella className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        Itinerary Weather Shield
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Correlates scheduled outdoor activities with hourly rain probabilities to prevent spoiled visits
                      </CardDescription>
                    </div>
                  </div>

                  {conflicts.length > 0 && (
                    <Button
                      onClick={handleApplyResolutions}
                      disabled={isApplying}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-semibold shadow-sm"
                    >
                      {isApplying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Apply Weather Fixes ({conflicts.length})
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {conflicts.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                      No Weather Conflicts Detected
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      All outdoor activities on this trip align with favorable, dry time windows. No rainy disruptions anticipated.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>{conflicts.length} activity conflict(s) detected during expected rainfall:</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {conflicts.map((conflict, idx) => (
                        <div
                          key={conflict.id || idx}
                          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          {/* Current conflict */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="destructive" className="text-xs gap-1">
                                <CloudRain className="w-3 h-3" />
                                {conflict.rainProbability}% Rain
                              </Badge>
                              <span className="text-xs font-semibold text-muted-foreground">
                                Day {conflict.dayNumber} ({conflict.date}) • {conflict.originalStartTime} - {conflict.originalEndTime}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              {conflict.itemTitle}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {conflict.conflictReason}
                            </p>
                          </div>

                          {/* Arrow indicator */}
                          <div className="hidden md:flex items-center justify-center text-amber-500 px-2">
                            <ArrowRight className="w-5 h-5" />
                          </div>

                          {/* Recommended Resolution */}
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200/80 md:w-96 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                                {conflict.action === "reschedule_time"
                                  ? "Reschedule to Dry Window"
                                  : conflict.action === "replace_indoor"
                                  ? "Replace with Indoor Attraction"
                                  : "Multi-Day Move"}
                              </span>
                              <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-800">
                                Recommended
                              </Badge>
                            </div>

                            {conflict.action === "reschedule_time" && (
                              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                Shift to <span className="font-bold text-blue-600">{conflict.newStartTime} - {conflict.newEndTime}</span> (Rain probability drops significantly)
                              </p>
                            )}

                            {conflict.action === "replace_indoor" && conflict.replacementAttraction && (
                              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                Swap with <span className="font-bold text-purple-700">{conflict.replacementAttraction.name}</span> ({conflict.replacementAttraction.category})
                              </p>
                            )}

                            <p className="text-[11px] text-muted-foreground italic">
                              {conflict.explanation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Multi-Day Forecast Grid */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Multi-Day Travel Forecast
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {weather.daily.map((day, idx) => {
                  const isSelected = selectedDayIndex === idx;
                  return (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]"
                          : "bg-white dark:bg-slate-900 hover:bg-slate-50 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="text-xs font-semibold opacity-80">
                        Day {idx + 1}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        {day.date.substring(5)}
                      </div>

                      <div className="my-2 flex justify-center">
                        {getWeatherIcon(day.condition, day.precipitationProbability > 40)}
                      </div>

                      <div className="text-sm font-bold text-center">
                        {day.tempMax}° / <span className="opacity-70 font-normal">{day.tempMin}°</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-current/10 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-400" />
                          {day.precipitationProbability}%
                        </span>
                        <span className="flex items-center gap-1 opacity-80">
                          <Wind className="w-3 h-3" />
                          {day.windSpeedMax}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hourly Weather Breakdown for Selected Day */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">
                      Hourly Breakdown for Day {selectedDayIndex + 1} ({weather.daily[selectedDayIndex]?.date})
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {weather.daily[selectedDayIndex]?.condition}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 overflow-x-auto">
                <div className="flex gap-3 min-w-[700px] pb-2">
                  {selectedDayHourly.map((h) => {
                    const isRainRisk = h.precipitationProbability >= 50;
                    return (
                      <div
                        key={h.time}
                        className={`flex-1 p-3 rounded-lg border text-center flex flex-col items-center justify-between min-w-[72px] ${
                          isRainRisk
                            ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800"
                            : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <span className="text-xs font-mono font-semibold text-muted-foreground">
                          {h.hour < 10 ? `0${h.hour}` : h.hour}:00
                        </span>

                        <div className="my-2">
                          {getWeatherIcon(h.condition, isRainRisk)}
                        </div>

                        <span className="text-sm font-bold">
                          {h.temperature}°
                        </span>

                        <div className="mt-2 space-y-1 w-full">
                          <div
                            className={`text-[10px] font-bold rounded px-1 py-0.5 ${
                              isRainRisk
                                ? "bg-blue-600 text-white"
                                : h.precipitationProbability > 20
                                ? "bg-sky-100 text-sky-800"
                                : "text-muted-foreground"
                            }`}
                          >
                            {h.precipitationProbability}% rain
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {h.windSpeed} km/h
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="p-12 text-center border-dashed">
            <CloudSun className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">No weather data found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Unable to load weather forecast for this destination.
            </p>
            <Button onClick={fetchWeatherData}>Try Again</Button>
          </Card>
        )}
      </main>
    </div>
  );
}
