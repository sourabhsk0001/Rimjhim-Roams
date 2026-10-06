"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  Hospital,
  PhoneCall,
  Share2,
  Copy,
  Check,
  RotateCcw,
  X,
  ExternalLink,
  Clock,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InteractiveMap, MapMarkerItem } from "@/components/map/interactive-map";
import { LostModeNavigationResult, SafePublicPlace } from "@/types/lost-mode";
import { useToast } from "@/components/ui/toast";

export interface LostModeModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
}

export function LostModeModal({
  tripId,
  isOpen,
  onClose,
  destinationName,
}: LostModeModalProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LostModeNavigationResult | null>(null);
  const [selectedRouteType, setSelectedRouteType] = useState<"walking" | "driving">("walking");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usingGps, setUsingGps] = useState(false);

  // Fetch or recompute lost recovery data
  const fetchLostRecovery = useCallback(
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
        setError(err instanceof Error ? err.message : "Failed to load recovery mode");
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLostRecovery();
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  }, [isOpen, fetchLostRecovery]);

  // Request browser GPS position
  const requestLiveGps = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unavailable",
        description: "Your device does not support GPS location. Using simulated position.",
        type: "info",
      });
      return;
    }

    setUsingGps(true);
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchLostRecovery({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        toast({
          title: "Live GPS Acquired",
          description: `Location locked with ±${Math.round(pos.coords.accuracy)}m accuracy.`,
          type: "success",
        });
      },
      (err) => {
        setUsingGps(false);
        setLoading(false);
        toast({
          title: "GPS Permission Denied",
          description: "Could not access location. Showing simulated off-route coordinates.",
          type: "info",
        });
        fetchLostRecovery();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Conversational Audio Read-Aloud
  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast({
        title: "Speech Synthesis Unavailable",
        description: "Audio readout is not supported on this browser.",
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
      `${data.aiGuidance.headline}. ${data.aiGuidance.plainExplanation} Nearest safe location is ${data.nearbySafePlaces[0]?.name || "Local Police"}.`
    );
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy Emergency Distress Message
  const handleCopyMessage = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.shareableDistressMessage);
    setCopied(true);
    toast({
      title: "Distress Message Copied",
      description: "Ready to paste into WhatsApp, SMS, or Telegram emergency chat.",
      type: "success",
    });
    setTimeout(() => setCopied(false), 2500);
  };

  // Build emergency map markers
  const rescueMarkers: MapMarkerItem[] = useMemo(() => {
    if (!data) return [];
    const markers: MapMarkerItem[] = [];

    // 1. Current Location Waypoint
    markers.push({
      id: "lost-current-location",
      name: data.currentLocation.name,
      latitude: data.currentLocation.latitude,
      longitude: data.currentLocation.longitude,
      type: "current_location",
      isSelected: true,
      details: {
        category: data.currentLocation.isSimulated
          ? "Simulated Off-Route Position"
          : "Live GPS Waypoint",
        description: `Distance to destination: ${data.distanceToTargetKm} km heading ${data.bearingCompass}.`,
      },
    });

    // 2. Planned Target Destination
    markers.push({
      id: "lost-planned-target",
      name: data.plannedCurrentStop.name,
      latitude: data.plannedCurrentStop.latitude,
      longitude: data.plannedCurrentStop.longitude,
      type: "attraction",
      order: 1,
      isSelected: true,
      details: {
        category: "Where You Should Be",
        hours: data.plannedCurrentStop.scheduledTime,
        description: `Scheduled stop: ${data.plannedCurrentStop.name}`,
      },
    });

    // 3. Next Planned Destination
    if (data.nextPlannedStop) {
      markers.push({
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

    // 4. Nearby Safe Havens
    data.nearbySafePlaces.slice(0, 4).forEach((sp, idx) => {
      markers.push({
        id: `safe-haven-${idx}`,
        name: sp.name,
        latitude: sp.latitude,
        longitude: sp.longitude,
        type: sp.type === "police" ? "railway" : sp.type === "hospital" ? "hotel" : "taxi",
        details: {
          category: sp.badgeLabel,
          description: `${sp.statusText} • ${sp.distanceMeters}m away (${sp.walkingMinutes} min walk).`,
          facilities: sp.is24x7 ? ["24/7 Active", "Safe Haven"] : ["Safe Haven"],
        },
      });
    });

    return markers;
  }, [data]);

  // Active route coordinates based on tab
  const activeRouteCoords = useMemo(() => {
    if (!data) return [];
    return selectedRouteType === "walking"
      ? data.primaryWalkingRoute.coordinates
      : data.alternativeDrivingRoute.coordinates;
  }, [data, selectedRouteType]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lost-mode-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-red-200/90 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* 1. Emergency Top Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-4 sm:px-6 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="lost-mode-title" className="text-base sm:text-lg font-bold tracking-tight">
                  “I&apos;m Lost / What Now?” Rescue Mode
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white text-red-700 tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs text-red-100">
                Live deviation tracking, safe havens, and conversational AI wayfinding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={requestLiveGps}
              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Acquire live device GPS position"
            >
              <NavIcon className="w-3.5 h-3.5" />
              <span>{usingGps ? "Re-lock GPS" : "Use Real GPS"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
              aria-label="Close lost mode dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && !data && (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-sm font-semibold text-slate-700">
                Calculating live location deviation and safe public havens...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
              <button
                onClick={() => fetchLostRecovery()}
                className="ml-auto px-3 py-1 bg-red-600 text-white text-xs rounded-full font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {data && (
            <>
              {/* 2. Key Telemetry Strip: Current Location -> Target -> Next */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* A. Current Location */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <NavIcon className="w-3 h-3 text-violet-600" /> Current Position
                  </span>
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">
                    {data.currentLocation.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {data.currentLocation.isSimulated
                      ? "Simulated ~1 km off planned route"
                      : "Verified GPS telemetry"}
                  </p>
                </div>

                {/* B. Where You Should Be */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-600" /> Target Right Now
                  </span>
                  <p className="text-sm font-bold text-emerald-950 line-clamp-1">
                    {data.plannedCurrentStop.name}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Scheduled: {data.plannedCurrentStop.scheduledTime}
                  </p>
                </div>

                {/* C. Distance & Bearing */}
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                    <Compass className="w-3 h-3 text-blue-600" /> Distance & Heading
                  </span>
                  <p className="text-base font-extrabold text-blue-950">
                    {data.distanceToTargetKm} km
                  </p>
                  <p className="text-[11px] text-blue-700 font-medium">
                    Bearing: {data.bearingCompass}
                  </p>
                </div>

                {/* D. Next Stop in Itinerary */}
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-600" /> Next Destination
                  </span>
                  <p className="text-sm font-bold text-purple-950 line-clamp-1">
                    {data.nextPlannedStop?.name || "Hotel Stay"}
                  </p>
                  <p className="text-[11px] text-purple-700 font-medium">
                    Scheduled: {data.nextPlannedStop?.scheduledTime || "Evening"}
                  </p>
                </div>
              </div>

              {/* 3. Conversational AI Explainer Banner */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 shadow-sm relative space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-900 block">
                        AI Recovery Navigator
                      </span>
                      <span className="text-[11px] text-blue-700">
                        Calm, actionable turn-by-turn instruction
                      </span>
                    </div>
                  </div>

                  {/* Audio Readout Button */}
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isSpeaking
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> Read Aloud
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm sm:text-base font-bold text-slate-900">
                    &ldquo;{data.aiGuidance.headline}&rdquo;
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {data.aiGuidance.plainExplanation}
                  </p>
                </div>

                {/* Step-by-Step Guidance Pills */}
                <div className="space-y-1.5 pt-2 border-t border-blue-200/70">
                  <span className="text-[11px] font-bold text-blue-900 block uppercase tracking-wider">
                    Turn-By-Turn Steps:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {data.aiGuidance.stepByStepAdvice.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-2xl bg-white/90 border border-blue-100 text-xs text-slate-800 shadow-2xs flex items-start gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety Tip & Toll-Free Phone */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blue-200/70 text-xs">
                  <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {data.aiGuidance.safetyTip}
                  </span>
                  <span className="text-blue-900 font-semibold bg-white/80 px-2.5 py-1 rounded-full border border-blue-200">
                    {data.aiGuidance.quickHelpline}
                  </span>
                </div>
              </div>

              {/* 4. Interactive Wayfinding Map */}
              <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm space-y-2">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">
                      Route Choice & Telemetry:
                    </span>
                    <div className="flex rounded-full border border-slate-300 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRouteType("walking")}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                          selectedRouteType === "walking"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Footprints className="w-3.5 h-3.5" />
                        <span>
                          Walk ({data.primaryWalkingRoute.durationMinutes}m • ETA{" "}
                          {data.primaryWalkingRoute.etaTimeString})
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRouteType("driving")}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
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

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block animate-ping" />
                      You
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                      Destination
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Safe Haven
                    </span>
                  </div>
                </div>

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
                  height="380px"
                />
              </div>

              {/* 5. Detailed Turn-by-Turn Pedestrian Navigation List */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-blue-600" />
                    Turn-By-Turn Pedestrian Waypoints
                  </span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {data.primaryWalkingRoute.turnByTurnSteps.length} Steps
                  </Badge>
                </div>

                <div className="space-y-2">
                  {data.primaryWalkingRoute.turnByTurnSteps.map((step, idx) => {
                    const isLast = idx === data.primaryWalkingRoute.turnByTurnSteps.length - 1;
                    return (
                      <div
                        key={step.id}
                        className={`p-3 rounded-2xl flex items-center gap-3 transition-colors ${
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
                </div>
              </div>

              {/* 6. Nearby Verified Safe & Public Places */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-slate-900">
                      Nearby Safe Public Havens (Police, 24/7 Hospitals, Transit, Cafes)
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    Sorted by walking distance
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.nearbySafePlaces.map((haven) => (
                    <div
                      key={haven.id}
                      className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                            {haven.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border text-slate-700 shrink-0">
                            {haven.badgeLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {haven.address}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          {haven.statusText}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <span className="text-[11px] font-bold text-blue-700">
                          {haven.distanceMeters} m ({haven.walkingMinutes} min walk)
                        </span>

                        <div className="flex items-center gap-1.5">
                          {haven.phone && (
                            <a
                              href={`tel:${haven.phone}`}
                              className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                            >
                              <PhoneCall className="w-3 h-3" />
                              <span>Call {haven.phone}</span>
                            </a>
                          )}
                          <a
                            href={`https://maps.google.com/?q=${haven.latitude},${haven.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Navigate</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7. Action Deck: Share Distress SMS / WhatsApp */}
              <div className="p-4 rounded-3xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    Share Your Live Location with Emergency Contacts
                  </span>
                  <p className="text-xs text-slate-300">
                    Includes exact coordinates, Google Maps link, planned destination, and national helplines.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="px-4 py-2 rounded-full bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Distress SMS / WhatsApp</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      data.shareableDistressMessage
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
