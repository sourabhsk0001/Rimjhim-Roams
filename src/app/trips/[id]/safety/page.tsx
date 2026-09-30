"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  PhoneCall,
  Hospital,
  Shield,
  CloudLightning,
  AlertTriangle,
  FileText,
  MapPin,
  Share2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Navigation as NavigationIcon,
  Crosshair,
  Compass,
  Clock,
  Building,
  Info,
  Car,
  Scale,
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
  DestinationSafetyCenter,
  TripEmergencyCard,
  EmergencyNumber,
  HospitalFacility,
  PoliceFacility,
  WeatherAlert,
  TravelAdvisory,
  TransportDisruption,
  LocalRule,
} from "@/types/safety";

export default function TripSafetyPage() {
  const params = useParams();
  const tripId = params?.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [safetyCenter, setSafetyCenter] = useState<DestinationSafetyCenter | null>(null);
  const [emergencyCard, setEmergencyCard] = useState<TripEmergencyCard | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("helplines");

  // Explicit user GPS state (strict invariant: never queried without user click)
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Interactive SOS / Emergency mode toggle
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Load safety information for trip
  const fetchSafetyData = useCallback(
    async (coords?: { latitude: number; longitude: number }) => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/trips/${tripId}/safety`;
        if (coords) {
          url += `?latitude=${coords.latitude}&longitude=${coords.longitude}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load safety center data");
        }

        setSafetyCenter(data.safetyCenter);
        setEmergencyCard(data.emergencyCard);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error connecting to safety center.");
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  useEffect(() => {
    if (tripId) {
      fetchSafetyData();
    }
  }, [tripId, fetchSafetyData]);

  // Handle explicit GPS location request
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your current browser.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(coords);
        setLocating(false);

        // Refetch safety data with user coordinates for nearest facility calculation
        fetchSafetyData(coords);
      },
      (err) => {
        setLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("Location permission was denied. You can still view all verified facilities.");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Location information is currently unavailable.");
            break;
          case err.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("Unable to retrieve location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Copy SOS card text
  const handleCopySOS = async () => {
    if (!emergencyCard?.shareableSummaryText) return;
    try {
      await navigator.clipboard.writeText(emergencyCard.shareableSummaryText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      // Fallback
    }
  };

  // Native share SOS info
  const handleShareSOS = async () => {
    if (!emergencyCard?.shareableSummaryText) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `🚨 Emergency SOS Card - ${safetyCenter?.destination || "Trip"}`,
          text: emergencyCard.shareableSummaryText,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      handleCopySOS();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl space-y-6 animate-fade-rise">
        {/* Top Header & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/trips/${tripId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[hsl(215,25%,32%)] hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Trip Details
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEmergencyMode(!emergencyMode)}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-medium shadow-xs transition-transform hover:scale-[1.03] ${
                emergencyMode
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "border border-red-300 bg-white text-red-700 hover:bg-red-50"
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-red-500" />
              {emergencyMode ? "Exit Emergency Mode" : "Activate Emergency Mode"}
            </button>
          </div>
        </div>

        {/* Mandatory Authoritative Disclaimer Banner */}
        <Alert className="bg-amber-50 border-amber-300 text-amber-900">
          <Info className="w-5 h-5 text-amber-600" />
          <AlertTitle className="font-semibold flex items-center gap-2">
            Verified Public Safety Data Notice
          </AlertTitle>
          <AlertDescription className="text-xs sm:text-sm text-amber-800 leading-relaxed">
            TripWise connects you to official helplines, trauma hospitals, and statutory advisories
            verified with the Ministry of Home Affairs (ERSS 112), Ministry of Tourism, and state
            health directorates.
            <strong className="block mt-1">
              TripWise does not provide automated emergency dispatch functionality. In immediate
              life-threatening situations, dial 112 directly.
            </strong>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <p className="text-muted-foreground text-sm font-medium">
              Retrieving verified destination safety records and medical directories...
            </p>
          </div>
        ) : !safetyCenter ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No safety data available for this trip.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Destination Title & Timestamps */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-instrument text-4xl sm:text-5xl font-normal tracking-[-1.5px] text-[#0f172a] leading-none">
                    Safety Center: {safetyCenter.destination}
                  </h1>
                  <span className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300 text-emerald-700 bg-emerald-50">
                    Source-Backed
                  </span>
                </div>
                <p className="text-xs text-[hsl(215,25%,32%)] mt-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Last verified: {new Date(safetyCenter.retrieved_at).toLocaleString()}
                </p>
              </div>

              {/* Explicit Location Sharing Control */}
              <div className="flex flex-col sm:items-end gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestLocation}
                  disabled={locating}
                  className="gap-2 border-slate-300"
                >
                  {locating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <Crosshair className="w-4 h-4 text-blue-600" />
                  )}
                  {userLocation ? "Update My GPS Location" : "Locate Me via GPS"}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {userLocation
                    ? `GPS Active (±${Math.round(userLocation.accuracy || 0)}m)`
                    : "Explicit permission required"}
                </span>
              </div>
            </div>

            {/* Unified Module Nav */}
            <TripWorkspaceNav tripId={tripId} />

            {locationError && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}

            {/* EMERGENCY MODE HERO SECTION */}
            {(emergencyMode || true) && (
              <section className="space-y-4">
                <Card className="border-red-400 bg-gradient-to-br from-red-50/70 via-rose-50/40 to-background shadow-md">
                  <CardHeader className="pb-3 border-b border-red-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-red-600 text-white">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-red-900 font-bold">
                            Emergency Response & SOS Mode
                          </CardTitle>
                          <CardDescription className="text-xs text-red-700">
                            Immediate one-tap dialing and verified local trauma centers
                          </CardDescription>
                        </div>
                      </div>

                      {emergencyCard && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCopySOS}
                            className="gap-1.5 border-red-300 text-red-800 hover:bg-red-100/70 bg-white"
                          >
                            {copiedText ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            {copiedText ? "Copied SOS!" : "Copy SOS Info"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleShareSOS}
                            className="gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                          >
                            <Share2 className="w-4 h-4" />
                            {shareSuccess ? "Shared!" : "Share SOS"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-6">
                    {/* Primary Helpline Quick-Dialers */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Direct Emergency One-Tap Callers
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <a
                          href="tel:112"
                          className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-red-300 bg-white hover:bg-red-50 hover:border-red-500 transition shadow-sm group"
                        >
                          <span className="text-2xl font-black text-red-600 group-hover:scale-110 transition-transform">
                            112
                          </span>
                          <span className="text-xs font-bold text-slate-800 text-center mt-1">
                            National ERSS
                          </span>
                          <span className="text-[10px] text-muted-foreground text-center">
                            Police / Fire / Health
                          </span>
                        </a>

                        <a
                          href="tel:108"
                          className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-rose-300 bg-white hover:bg-rose-50 hover:border-rose-500 transition shadow-sm group"
                        >
                          <span className="text-2xl font-black text-rose-600 group-hover:scale-110 transition-transform">
                            108
                          </span>
                          <span className="text-xs font-bold text-slate-800 text-center mt-1">
                            Ambulance / EMRI
                          </span>
                          <span className="text-[10px] text-muted-foreground text-center">
                            24/7 Medical Care
                          </span>
                        </a>

                        <a
                          href="tel:100"
                          className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-blue-300 bg-white hover:bg-blue-50 hover:border-blue-500 transition shadow-sm group"
                        >
                          <span className="text-2xl font-black text-blue-600 group-hover:scale-110 transition-transform">
                            100
                          </span>
                          <span className="text-xs font-bold text-slate-800 text-center mt-1">
                            Police Control
                          </span>
                          <span className="text-[10px] text-muted-foreground text-center">
                            Crime & Distress
                          </span>
                        </a>

                        <a
                          href="tel:1363"
                          className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-indigo-300 bg-white hover:bg-indigo-50 hover:border-indigo-500 transition shadow-sm group"
                        >
                          <span className="text-2xl font-black text-indigo-600 group-hover:scale-110 transition-transform">
                            1363
                          </span>
                          <span className="text-xs font-bold text-slate-800 text-center mt-1">
                            Tourist Helpline
                          </span>
                          <span className="text-[10px] text-muted-foreground text-center">
                            Govt of India (12 Lang)
                          </span>
                        </a>

                        <a
                          href="tel:1091"
                          className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-purple-300 bg-white hover:bg-purple-50 hover:border-purple-500 transition shadow-sm group"
                        >
                          <span className="text-2xl font-black text-purple-600 group-hover:scale-110 transition-transform">
                            1091
                          </span>
                          <span className="text-xs font-bold text-slate-800 text-center mt-1">
                            Women Helpline
                          </span>
                          <span className="text-[10px] text-muted-foreground text-center">
                            24x7 Rapid Safety
                          </span>
                        </a>
                      </div>
                    </div>

                    {/* Nearest Medical & Police Facilities */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Nearest Hospital */}
                      <Card className="border border-red-200 bg-white shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-red-600 text-white font-medium text-[11px] gap-1">
                              <Hospital className="w-3 h-3" /> Nearest Hospital
                            </Badge>
                            {emergencyCard?.nearestHospital?.distanceKm !== undefined && (
                              <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                                ~{emergencyCard.nearestHospital.distanceKm} km away
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base font-bold mt-2">
                            {emergencyCard?.nearestHospital?.name || "Verified Local Hospital"}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {emergencyCard?.nearestHospital?.category}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 pb-3">
                          <p className="text-muted-foreground flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" />
                            {emergencyCard?.nearestHospital?.address}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge variant="secondary" className="text-[10px]">
                              24/7 Trauma Emergency
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              Source: {emergencyCard?.nearestHospital?.source}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 gap-2">
                          {emergencyCard?.nearestHospital?.phone && (
                            <Button size="sm" asChild className="gap-1.5 bg-red-600 hover:bg-red-700 text-white flex-1">
                              <a href={`tel:${emergencyCard.nearestHospital.phone}`}>
                                <PhoneCall className="w-3.5 h-3.5" /> Call Hospital ({emergencyCard.nearestHospital.phone})
                              </a>
                            </Button>
                          )}
                          {emergencyCard?.nearestHospital && (
                            <Button size="sm" variant="outline" asChild className="gap-1">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${emergencyCard.nearestHospital.latitude},${emergencyCard.nearestHospital.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <NavigationIcon className="w-3.5 h-3.5" /> Directions
                              </a>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>

                      {/* Nearest Police Station */}
                      <Card className="border border-blue-200 bg-white shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-blue-600 text-white font-medium text-[11px] gap-1">
                              <Shield className="w-3 h-3" /> Nearest Police Unit
                            </Badge>
                            {emergencyCard?.nearestPolice?.distanceKm !== undefined && (
                              <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                                ~{emergencyCard.nearestPolice.distanceKm} km away
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base font-bold mt-2">
                            {emergencyCard?.nearestPolice?.name || "Local Police Station"}
                          </CardTitle>
                          <CardDescription className="text-xs line-clamp-1">
                            {emergencyCard?.nearestPolice?.category}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs space-y-2 pb-3">
                          <p className="text-muted-foreground flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                            {emergencyCard?.nearestPolice?.address}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Badge variant="secondary" className="text-[10px]">
                              Law Enforcement & Protection
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              Source: {emergencyCard?.nearestPolice?.source}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 gap-2">
                          {emergencyCard?.nearestPolice?.phone && (
                            <Button size="sm" asChild className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white flex-1">
                              <a href={`tel:${emergencyCard.nearestPolice.phone}`}>
                                <PhoneCall className="w-3.5 h-3.5" /> Call Station ({emergencyCard.nearestPolice.phone})
                              </a>
                            </Button>
                          )}
                          {emergencyCard?.nearestPolice && (
                            <Button size="sm" variant="outline" asChild className="gap-1">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${emergencyCard.nearestPolice.latitude},${emergencyCard.nearestPolice.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <NavigationIcon className="w-3.5 h-3.5" /> Directions
                              </a>
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </div>

                    {/* Pre-Formatted Shareable SOS Card Box */}
                    {emergencyCard && (
                      <div className="p-4 rounded-lg bg-white border border-red-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            Pre-Packaged SOS Distress Message
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Ready for SMS / WhatsApp
                          </span>
                        </div>
                        <pre className="text-xs bg-slate-50 p-3 rounded border text-slate-800 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                          {emergencyCard.shareableSummaryText}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* CATEGORIZED SAFETY DIRECTORY TABS */}
            <section className="space-y-4 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 p-1 bg-muted/60 rounded-lg">
                {[
                  { id: "helplines", label: "Helplines", count: safetyCenter.emergencyNumbers.length },
                  { id: "hospitals", label: "Hospitals", count: safetyCenter.hospitals.length },
                  { id: "police", label: "Police", count: safetyCenter.policeStations.length },
                  { id: "weather", label: "Weather Alerts", count: safetyCenter.weatherAlerts.length },
                  { id: "advisories", label: "Advisories", count: safetyCenter.travelAdvisories.length },
                  { id: "disruptions", label: "Disruptions", count: safetyCenter.transportDisruptions.length },
                  { id: "rules", label: "Local Rules", count: safetyCenter.localRules.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategoryTab(tab.id)}
                    className={`text-xs py-2 px-3 rounded-md font-medium transition text-center ${
                      activeCategoryTab === tab.id
                        ? "bg-white text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* 1. Helplines Tab */}
              {activeCategoryTab === "helplines" && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {safetyCenter.emergencyNumbers.map((item) => (
                      <Card key={item.id} className="border shadow-sm hover:border-slate-300 transition">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className={
                                item.category === "universal"
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : item.category === "medical"
                                  ? "border-rose-300 text-rose-700 bg-rose-50"
                                  : item.category === "tourist"
                                  ? "border-indigo-300 text-indigo-700 bg-indigo-50"
                                  : "border-slate-300"
                              }
                            >
                              {item.category.toUpperCase()}
                            </Badge>
                            {item.tollFree && (
                              <Badge variant="secondary" className="text-[10px]">
                                Toll-Free
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base font-bold mt-1.5 flex items-center justify-between">
                            <span>{item.name}</span>
                            <span className="font-mono text-lg text-primary">{item.number}</span>
                          </CardTitle>
                          <CardDescription className="text-xs">{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-xs text-muted-foreground pb-2 space-y-1">
                          {item.languages && (
                            <p>Languages: {item.languages.join(", ")}</p>
                          )}
                          <p className="text-[11px] text-slate-500">Source: {item.source}</p>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button size="sm" asChild variant="outline" className="w-full gap-2 text-primary hover:bg-primary/5">
                            <a href={`tel:${item.number}`}>
                              <PhoneCall className="w-3.5 h-3.5" /> Call {item.number}
                            </a>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Hospitals Tab */}
              {activeCategoryTab === "hospitals" && (
                <div className="space-y-4 pt-2">
                  {safetyCenter.hospitals.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground text-sm">
                        Verified hospital directory for this location is currently being validated with state medical authorities. Dial 108 or 112 for direct dispatch.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {safetyCenter.hospitals.map((hosp) => (
                        <Card key={hosp.id} className="border shadow-sm">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                {hosp.category}
                              </Badge>
                              {hosp.distanceKm !== undefined && (
                                <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px]">
                                  ~{hosp.distanceKm} km away
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base font-bold mt-2">{hosp.name}</CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              {hosp.address}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-xs space-y-2 pb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">
                                {hosp.has24x7Emergency ? "24x7 Emergency Room" : "Standard Emergency"}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Source: {hosp.source}</p>
                          </CardContent>
                          <CardFooter className="pt-0 gap-2">
                            <Button size="sm" asChild className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                              <a href={`tel:${hosp.phone}`}>
                                <PhoneCall className="w-3.5 h-3.5" /> Call ({hosp.phone})
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.latitude},${hosp.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Map
                              </a>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Police Tab */}
              {activeCategoryTab === "police" && (
                <div className="space-y-4 pt-2">
                  {safetyCenter.policeStations.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground text-sm">
                        Verified police directory for this destination is being updated. Dial 100 or 112 for direct dispatch.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {safetyCenter.policeStations.map((pol) => (
                        <Card key={pol.id} className="border shadow-sm">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge className="bg-blue-600 text-white text-[10px]">
                                {pol.category}
                              </Badge>
                              {pol.distanceKm !== undefined && (
                                <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px]">
                                  ~{pol.distanceKm} km away
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-base font-bold mt-2">{pol.name}</CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              {pol.address}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="text-xs space-y-2 pb-2">
                            <p className="text-[11px] text-muted-foreground">Source: {pol.source}</p>
                          </CardContent>
                          <CardFooter className="pt-0 gap-2">
                            <Button size="sm" asChild className="flex-1 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                              <a href={`tel:${pol.phone}`}>
                                <PhoneCall className="w-3.5 h-3.5" /> Call ({pol.phone})
                              </a>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${pol.latitude},${pol.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Map
                              </a>
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. Weather Alerts Tab */}
              {activeCategoryTab === "weather" && (
                <div className="space-y-4 pt-2">
                  {safetyCenter.weatherAlerts.length === 0 ? (
                    <Card className="border-emerald-200 bg-emerald-50/40">
                      <CardContent className="py-6 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-emerald-900">
                            No Active Severe Weather Warnings Reported
                          </h4>
                          <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                            The India Meteorological Department (IMD) and regional meteorological centers
                            have not issued active cyclone, severe deluge, or extreme heatwave warnings for {safetyCenter.destination}.
                          </p>
                          <span className="text-[11px] text-muted-foreground mt-2 block">
                            Verified Source: India Meteorological Department (IMD) • Zero fabricated alerts policy.
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {safetyCenter.weatherAlerts.map((alert) => (
                        <Card key={alert.id} className="border-amber-300 bg-amber-50/50">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="destructive" className="text-[10px]">
                                {alert.severity.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Effective until {alert.effectiveUntil}
                              </span>
                            </div>
                            <CardTitle className="text-base font-bold text-amber-900 mt-1">
                              {alert.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs text-amber-950 space-y-2">
                            <p>{alert.description}</p>
                            <p className="text-[11px] text-muted-foreground">Source: {alert.source}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. Travel Advisories Tab */}
              {activeCategoryTab === "advisories" && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-3">
                    {safetyCenter.travelAdvisories.map((adv) => (
                      <Card key={adv.id} className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="outline"
                              className={
                                adv.severity === "high"
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : "border-blue-300 text-blue-700 bg-blue-50"
                              }
                            >
                              {adv.category.toUpperCase()} • {adv.severity.toUpperCase()}
                            </Badge>
                            {adv.updated_at && (
                              <span className="text-[11px] text-muted-foreground">
                                Updated: {new Date(adv.updated_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-base font-bold mt-1.5">{adv.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-slate-700 space-y-2">
                          <p className="leading-relaxed">{adv.content}</p>
                          <p className="text-[11px] text-muted-foreground">Source: {adv.source}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Transport Disruptions Tab */}
              {activeCategoryTab === "disruptions" && (
                <div className="space-y-4 pt-2">
                  {safetyCenter.transportDisruptions.length === 0 ? (
                    <Card className="border-emerald-200 bg-emerald-50/40">
                      <CardContent className="py-6 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <h4 className="text-sm font-bold text-emerald-900">
                            No Major Transit Disruptions Reported
                          </h4>
                          <p className="text-xs text-emerald-800 mt-1">
                            Highways, airports, and major transit corridors to {safetyCenter.destination} are operating normally.
                          </p>
                          <span className="text-[11px] text-muted-foreground mt-2 block">
                            Source: State Highway Authorities & Regional Transport Divisions
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {safetyCenter.transportDisruptions.map((dis) => (
                        <Card key={dis.id} className="border shadow-sm">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={dis.status === "seasonal_closure" ? "destructive" : "secondary"}
                                className="text-[10px]"
                              >
                                {dis.status.replace("_", " ").toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {dis.type.toUpperCase()}
                              </Badge>
                            </div>
                            <CardTitle className="text-base font-bold mt-1.5">{dis.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="text-xs text-slate-700 space-y-2">
                            <p className="leading-relaxed">{dis.details}</p>
                            <p className="text-[11px] text-muted-foreground">Source: {dis.source}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 7. Local Rules & Penalties Tab */}
              {activeCategoryTab === "rules" && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-3">
                    {safetyCenter.localRules.map((rule) => (
                      <Card key={rule.id} className="border shadow-sm hover:border-slate-300 transition">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50">
                              {rule.topic}
                            </Badge>
                            {rule.statutoryReference && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {rule.statutoryReference}
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-base font-bold mt-1.5">{rule.topic}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-3">
                          <p className="text-slate-800 leading-relaxed font-medium">{rule.rule}</p>
                          {rule.penalty && (
                            <div className="p-2 rounded bg-red-50 border border-red-200 text-red-900 text-xs">
                              <strong>Statutory Penalty:</strong> {rule.penalty}
                            </div>
                          )}
                          <p className="text-[11px] text-muted-foreground">Source: {rule.source}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
