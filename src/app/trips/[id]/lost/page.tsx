"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Compass,
  MapPin,
  Footprints,
  Car,
  Navigation as NavIcon,
  Volume2,
  VolumeX,
  Shield,
  PhoneCall,
  Share2,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  Clock,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
import { InteractiveMap, MapMarkerItem } from "@/components/map/interactive-map";
import { LostModeNavigationResult } from "@/types/lost-mode";
import { useToast } from "@/components/ui/toast";

export default function TripLostModePage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LostModeNavigationResult | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<"walking" | "driving">("walking");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usingGps, setUsingGps] = useState(false);

  const fetchLostData = useCallback(
    async (coords?: { latitude: number; longitude: number; accuracy?: number }) => {
      setLoading(true);
      setError(null);
      try {
        let url = `/api/trips/${tripId}/lost-mode`;
        if (coords) {
          url += `?latitude=${coords.latitude}&longitude=${coords.longitude}&accuracy=${coords.accuracy || 15}`;
        }
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to calculate recovery navigation");
        }
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load lost recovery data");
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  useEffect(() => {
    if (tripId) {
      fetchLostData();
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [tripId, fetchLostData]);

  // Request real GPS
  const requestLiveGps = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unavailable",
        description: "Your browser does not support GPS. Using simulated position.",
        type: "info",
      });
      return;
    }

    setUsingGps(true);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchLostData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        toast({
          title: "Live GPS Acquired",
          description: `Locked with ±${Math.round(pos.coords.accuracy)}m accuracy.`,
          type: "success",
        });
      },
      () => {
        setUsingGps(false);
        setLoading(false);
        toast({
          title: "GPS Access Denied",
          description: "Using simulated off-route coordinates.",
          type: "info",
        });
        fetchLostData();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Text-to-speech audio readout
  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast({
        title: "Speech Unavailable",
        description: "Audio readout is not supported on this device.",
        type: "info",
      });
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!data) return;

    const utterance = new SpeechSynthesisUtterance(
      `${data.aiGuidance.headline}. ${data.aiGuidance.plainExplanation}`
    );
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy distress text
  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.shareableDistressMessage);
    setCopied(true);
    toast({
      title: "SOS Message Copied",
      description: "Ready to share with friends, family, or travel party.",
      type: "success",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  // Map markers
  const rescueMarkers: MapMarkerItem[] = useMemo(() => {
    if (!data) return [];
    const list: MapMarkerItem[] = [];

    list.push({
      id: "lost-current-location",
      name: data.currentLocation.name,
      latitude: data.currentLocation.latitude,
      longitude: data.currentLocation.longitude,
      type: "current_location",
      isSelected: true,
      details: {
        category: data.currentLocation.isSimulated
          ? "Simulated Off-Route Position"
          : "Live GPS Telemetry",
        description: `Distance: ${data.distanceToTargetKm} km heading ${data.bearingCompass}.`,
      },
    });

    list.push({
      id: "lost-planned-target",
      name: data.plannedCurrentStop.name,
      latitude: data.plannedCurrentStop.latitude,
      longitude: data.plannedCurrentStop.longitude,
      type: "attraction",
      order: 1,
      isSelected: true,
      details: {
        category: "Scheduled Destination",
        hours: data.plannedCurrentStop.scheduledTime,
      },
    });

    if (data.nextPlannedStop) {
      list.push({
        id: "lost-next-target",
        name: data.nextPlannedStop.name,
        latitude: data.nextPlannedStop.latitude,
        longitude: data.nextPlannedStop.longitude,
        type: "attraction",
        order: 2,
        details: {
          category: "Next Destination",
          hours: data.nextPlannedStop.scheduledTime,
        },
      });
    }

    data.nearbySafePlaces.slice(0, 4).forEach((sp, idx) => {
      list.push({
        id: `safe-haven-${idx}`,
        name: sp.name,
        latitude: sp.latitude,
        longitude: sp.longitude,
        type: sp.type === "police" ? "railway" : sp.type === "hospital" ? "hotel" : "taxi",
        details: {
          category: sp.badgeLabel,
          description: `${sp.statusText} • ${sp.distanceMeters}m away (${sp.walkingMinutes} min walk).`,
        },
      });
    });

    return list;
  }, [data]);

  const activeRouteCoords = useMemo(() => {
    if (!data) return [];
    return selectedRouteType === "walking"
      ? data.primaryWalkingRoute.coordinates
      : data.alternativeDrivingRoute.coordinates;
  }, [data, selectedRouteType]);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl space-y-6 animate-fade-rise">
        {/* Top Back & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(215,25%,32%)] hover:text-[#0f172a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Trip Overview
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestLiveGps}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <NavIcon className="w-3.5 h-3.5 text-violet-600" />
              <span>{usingGps ? "Re-sync GPS" : "Acquire Live GPS"}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchLostData()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh Calculation</span>
            </button>
          </div>
        </div>

        {/* Emergency Banner Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 sm:p-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase bg-white text-red-700 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                  🆘 Wayfinding Rescue Active
                </span>
                <Badge variant="outline" className="border-white/30 text-white text-xs">
                  {data?.destinationName || "Active Trip"}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                “I&apos;m Lost / What Now?” Rescue Mode
              </h1>
              <p className="text-xs sm:text-sm text-red-100 max-w-xl">
                Real-time deviation recalculation from your planned itinerary stop, turn-by-turn pedestrian corridor guidance, and nearby safe public havens.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={toggleSpeech}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-4 h-4 text-red-200" /> Stop Audio
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" /> Listen to Guidance
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" /> Share Location (SMS/WA)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Strip */}
        <TripWorkspaceNav tripId={tripId} />

        {loading && !data && (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <p className="text-sm font-semibold text-slate-600">
              Locking coordinates and querying local safe havens...
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="space-y-6">
            {/* Key Telemetry Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <NavIcon className="w-3.5 h-3.5 text-violet-600" /> Current Position
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {data.currentLocation.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {data.currentLocation.isSimulated
                    ? "Simulated ~1 km off planned itinerary"
                    : "Verified GPS lock"}
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Where You Should Be
                </span>
                <p className="text-sm sm:text-base font-bold text-emerald-950 truncate">
                  {data.plannedCurrentStop.name}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Scheduled: {data.plannedCurrentStop.scheduledTime}
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-600" /> Distance & Heading
                </span>
                <p className="text-base sm:text-lg font-extrabold text-blue-950">
                  {data.distanceToTargetKm} km
                </p>
                <p className="text-[11px] text-blue-700 font-medium">
                  Bearing: {data.bearingCompass}
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-purple-50/70 border border-purple-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" /> Next Planned Stop
                </span>
                <p className="text-sm sm:text-base font-bold text-purple-950 truncate">
                  {data.nextPlannedStop?.name || "Booked Stay"}
                </p>
                <p className="text-[11px] text-purple-700 font-medium">
                  Scheduled: {data.nextPlannedStop?.scheduledTime || "Evening"}
                </p>
              </div>
            </div>

            {/* AI Explanation Banner */}
            <Card className="rounded-3xl border-blue-200 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-sky-50/70 shadow-sm">
              <CardHeader className="pb-3 border-b border-blue-100">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-blue-950">
                        AI Recovery Explanation & Guidance
                      </CardTitle>
                      <CardDescription className="text-xs text-blue-700">
                        Contextualized for {data.destinationName}
                      </CardDescription>
                    </div>
                  </div>

                  <span className="text-xs font-semibold bg-white border border-blue-200 text-blue-900 px-3 py-1 rounded-full">
                    {data.aiGuidance.quickHelpline}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                <p className="text-base font-bold text-slate-900">
                  &ldquo;{data.aiGuidance.headline}&rdquo;
                </p>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {data.aiGuidance.plainExplanation}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-blue-100">
                  {data.aiGuidance.stepByStepAdvice.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-blue-100 text-xs text-slate-800 shadow-2xs flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{data.aiGuidance.safetyTip}</span>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Recovery Map */}
            <Card className="rounded-3xl overflow-hidden shadow-md">
              <CardHeader className="pb-3 border-b bg-slate-50/70">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900">Select Mode:</span>
                    <div className="flex rounded-full border border-slate-300 bg-white p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSelectedRouteType("walking")}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          selectedRouteType === "walking"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Footprints className="w-3.5 h-3.5" />
                        <span>
                          Walking ({data.primaryWalkingRoute.durationMinutes}m • ETA{" "}
                          {data.primaryWalkingRoute.etaTimeString})
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRouteType("driving")}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          selectedRouteType === "driving"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Car className="w-3.5 h-3.5" />
                        <span>
                          Cab / Auto ({data.alternativeDrivingRoute.durationMinutes}m • ₹
                          {data.alternativeDrivingRoute.estimatedFareInr})
                        </span>
                      </button>
                    </div>
                  </div>

                  <Badge variant="outline" className="font-mono text-xs">
                    MapLibre Rescue View
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <InteractiveMap
                  center={[data.currentLocation.latitude, data.currentLocation.longitude]}
                  zoom={14}
                  markers={rescueMarkers}
                  routeCoordinates={activeRouteCoords}
                  routeDistanceKm={
                    selectedRouteType === "walking"
                      ? data.primaryWalkingRoute.distanceKm
                      : data.alternativeDrivingRoute.distanceKm
                  }
                  routeDurationMinutes={
                    selectedRouteType === "walking"
                      ? data.primaryWalkingRoute.durationMinutes
                      : data.alternativeDrivingRoute.durationMinutes
                  }
                  routeTransportCostInr={
                    selectedRouteType === "walking"
                      ? 0
                      : data.alternativeDrivingRoute.estimatedFareInr
                  }
                  currentLocation={data.currentLocation}
                  height="460px"
                />
              </CardContent>
            </Card>

            {/* Turn-by-Turn Waypoints */}
            <Card className="rounded-3xl shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-blue-600" /> Turn-by-Turn Pedestrian Corridor
                  </CardTitle>
                  <Badge variant="outline" className="font-mono text-xs">
                    {data.primaryWalkingRoute.turnByTurnSteps.length} Steps
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {data.primaryWalkingRoute.turnByTurnSteps.map((step, idx) => {
                  const isLast = idx === data.primaryWalkingRoute.turnByTurnSteps.length - 1;
                  return (
                    <div
                      key={step.id}
                      className={`p-3.5 rounded-2xl flex items-center gap-3.5 transition-colors ${
                        isLast
                          ? "bg-emerald-50 border border-emerald-200 font-semibold text-emerald-950"
                          : "bg-slate-50 border border-slate-100 text-slate-800"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isLast
                            ? "bg-emerald-600 text-white"
                            : step.turnDirection === "left"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isLast ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : step.turnDirection === "left" ? (
                          <CornerUpLeft className="w-4 h-4" />
                        ) : step.turnDirection === "right" ? (
                          <CornerUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowUp className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-xs sm:text-sm leading-tight">
                          {step.instruction}
                        </p>
                      </div>

                      {step.distanceMeters > 0 && (
                        <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
                          {step.distanceMeters} m
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Nearby Safe Public Havens */}
            <Card className="rounded-3xl shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" /> Nearby Safe Public Havens
                  </CardTitle>
                  <span className="text-xs text-slate-400">
                    Closest verified help stations
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {data.nearbySafePlaces.map((haven) => (
                    <div
                      key={haven.id}
                      className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-sm text-slate-900 line-clamp-1">
                            {haven.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border text-slate-700 shrink-0">
                            {haven.badgeLabel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {haven.address}
                        </p>
                        <p className="text-xs text-emerald-700 font-medium">
                          {haven.statusText}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-200/60 text-xs">
                        <span className="font-bold text-blue-700">
                          {haven.distanceMeters} m ({haven.walkingMinutes} min walk)
                        </span>

                        <div className="flex items-center gap-1.5">
                          {haven.phone && (
                            <a
                              href={`tel:${haven.phone}`}
                              className="px-3 py-1.5 rounded-full bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Call {haven.phone}</span>
                            </a>
                          )}
                          <a
                            href={`https://maps.google.com/?q=${haven.latitude},${haven.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Navigate</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
