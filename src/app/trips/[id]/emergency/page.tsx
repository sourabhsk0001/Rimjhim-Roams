"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertOctagon,
  PhoneCall,
  Hospital,
  Shield,
  Pill,
  Building2,
  MapPin,
  Navigation as NavigationIcon,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Clock,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  HeartPulse,
  Compass,
  Hotel,
  Car,
  Footprints,
  Radio,
  Loader2,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { TripWorkspaceNav } from "@/components/travel/trip-workspace-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  EmergencyModeResult,
  EmergencyFacility,
  EmergencyFacilityType,
  EmergencyContact,
} from "@/types/emergency-mode";

export default function TripEmergencyPage() {
  const params = useParams();
  const tripId = params?.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmergencyModeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<EmergencyFacilityType | "hotel">("hospital");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [routeMode, setRouteMode] = useState<"walking" | "driving">("walking");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Load emergency data
  const loadData = useCallback(
    async (coords?: { latitude: number; longitude: number; accuracy?: number }, targetId?: string) => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/trips/${tripId}/emergency`;
        const q = new URLSearchParams();
        if (coords) {
          q.append("latitude", coords.latitude.toString());
          q.append("longitude", coords.longitude.toString());
          if (coords.accuracy) q.append("accuracy", coords.accuracy.toString());
        }
        if (targetId) {
          q.append("facilityId", targetId);
        }
        if (q.toString()) url += `?${q.toString()}`;

        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load emergency data");
        }

        setData(json);
        if (targetId) setSelectedFacilityId(targetId);
        else if (json.nearestFacility) setSelectedFacilityId(json.nearestFacility.id);

        if (json.emergencyContacts && json.emergencyContacts.length > 0) {
          const selected = json.emergencyContacts
            .filter((c: EmergencyContact) => c.isSelected || c.isPrimary)
            .map((c: EmergencyContact) => c.id);
          setSelectedContactIds(selected.length > 0 ? selected : [json.emergencyContacts[0].id]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load emergency services");
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  const refreshLiveGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unsupported",
        description: "Browser geolocation is not available on this device.",
        variant: "error",
      });
      loadData();
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        toast({
          title: "📍 Live GPS Locked",
          description: `Accurate to ±${Math.round(pos.coords.accuracy)}m.`,
        });
        loadData(coords, selectedFacilityId || undefined);
      },
      (err) => {
        setGpsLoading(false);
        toast({
          title: "GPS Access Restricted",
          description: "Using simulated off-route destination coordinates.",
        });
        loadData(undefined, selectedFacilityId || undefined);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [loadData, selectedFacilityId, toast]);

  useEffect(() => {
    refreshLiveGps();
  }, [refreshLiveGps]);

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSelectFacility = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
    if (data?.currentLocation) {
      loadData(
        {
          latitude: data.currentLocation.latitude,
          longitude: data.currentLocation.longitude,
          accuracy: data.currentLocation.accuracyMeters,
        },
        facilityId
      );
    }
  };

  const handleShareWhatsApp = () => {
    if (!data) return;
    const text = encodeURIComponent(data.shareableDistressMessage);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareSms = () => {
    if (!data) return;
    const selectedPhones = data.emergencyContacts
      .filter((c) => selectedContactIds.includes(c.id))
      .map((c) => c.phone.replace(/\s+/g, ""))
      .join(",");
    const text = encodeURIComponent(data.shareableDistressMessage);
    window.location.href = `sms:${selectedPhones}?&body=${text}`;
  };

  const handleCopyDistressMessage = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.shareableDistressMessage);
      setCopiedSuccess(true);
      toast({
        title: "📋 Emergency Info Copied",
        description: "Emergency details and GPS location copied to clipboard.",
      });
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch {
      toast({
        title: "Copy Failed",
        description: "Please manually copy the emergency message.",
        variant: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Workspace Sub Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/trips/${tripId}`}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span className="p-1.5 bg-red-600 rounded-lg text-white">
                    <AlertOctagon className="w-5 h-5" />
                  </span>
                  EMERGENCY MODE
                </h1>
                <Badge variant="destructive" className="bg-red-700 font-mono text-xs uppercase animate-pulse">
                  Priority 1
                </Badge>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Decision Support, Verified Facilities & Location Broadcast for{" "}
                <span className="font-semibold text-white">{data?.destination || "Your Trip"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-zinc-700 text-zinc-300 hover:text-white"
              onClick={refreshLiveGps}
              disabled={gpsLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${gpsLoading ? "animate-spin" : ""}`} />
              {gpsLoading ? "Locking GPS..." : "Refresh Location"}
            </Button>

            <Link href={`/trips/${tripId}/lost`}>
              <Button size="sm" variant="destructive" className="h-8 text-xs bg-red-800 hover:bg-red-700">
                🆘 I&apos;m Lost Mode
              </Button>
            </Link>
          </div>
        </div>

        <TripWorkspaceNav tripId={tripId} />

        {/* Legal & Decision Support Invariant Alert */}
        <div className="p-4 bg-red-950/70 border border-red-700/80 rounded-xl flex items-start gap-3.5 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-red-200 leading-relaxed">
            <strong className="text-red-100 font-bold uppercase tracking-wider block mb-0.5">
              Decision Support Notice — Not an Emergency Dispatch Service
            </strong>
            This feature provides offline facility directories, navigation waypoints, and location broadcast to assist your decision-making. If you or someone near you is experiencing a medical emergency, crime, fire, or physical threat, <strong>dial 112 or 108 directly without delay</strong>.
          </div>
        </div>

        {/* Quick One-Tap Helplines Deck */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-red-400" /> Instant One-Tap Emergency Helplines
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <a
              href="tel:112"
              className="flex items-center justify-between p-3.5 bg-red-900/40 hover:bg-red-900/70 border border-red-700/80 rounded-xl text-white transition-all group shadow-md"
            >
              <div>
                <div className="text-xs text-red-300 font-medium">All-India Universal</div>
                <div className="text-2xl font-black text-white group-hover:scale-105 transition-transform">112</div>
              </div>
              <div className="p-2.5 bg-red-600 rounded-xl group-hover:bg-red-500 shadow-md">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
            </a>

            <a
              href="tel:108"
              className="flex items-center justify-between p-3.5 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-700/80 rounded-xl text-white transition-all group shadow-md"
            >
              <div>
                <div className="text-xs text-emerald-300 font-medium">Ambulance / Trauma</div>
                <div className="text-2xl font-black text-white group-hover:scale-105 transition-transform">108</div>
              </div>
              <div className="p-2.5 bg-emerald-600 rounded-xl group-hover:bg-emerald-500 shadow-md">
                <HeartPulse className="w-5 h-5 text-white" />
              </div>
            </a>

            <a
              href="tel:100"
              className="flex items-center justify-between p-3.5 bg-blue-950/40 hover:bg-blue-950/70 border border-blue-700/80 rounded-xl text-white transition-all group shadow-md"
            >
              <div>
                <div className="text-xs text-blue-300 font-medium">Police Control Room</div>
                <div className="text-2xl font-black text-white group-hover:scale-105 transition-transform">100</div>
              </div>
              <div className="p-2.5 bg-blue-600 rounded-xl group-hover:bg-blue-500 shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </a>

            <a
              href="tel:1363"
              className="flex items-center justify-between p-3.5 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-700/80 rounded-xl text-white transition-all group shadow-md"
            >
              <div>
                <div className="text-xs text-amber-300 font-medium">Tourist Helpline (24/7)</div>
                <div className="text-2xl font-black text-white group-hover:scale-105 transition-transform">1363</div>
              </div>
              <div className="p-2.5 bg-amber-600 rounded-xl group-hover:bg-amber-500 shadow-md">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
            </a>
          </div>
        </div>

        {/* Location & Hotel Address Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current Location */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400" /> Current Location
              </span>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px] font-mono">
                {data?.currentLocation.isSimulated ? "Simulated Fallback" : `Live GPS ±${Math.round(data?.currentLocation.accuracyMeters || 10)}m`}
              </Badge>
            </div>

            {data?.currentLocation ? (
              <div className="space-y-1">
                <div className="text-base font-bold text-white">
                  {data.currentLocation.landmarkDescription}
                </div>
                <div className="text-xs font-mono text-zinc-400 flex items-center justify-between pt-1">
                  <span>
                    Lat: {data.currentLocation.latitude.toFixed(6)}, Lng: {data.currentLocation.longitude.toFixed(6)}
                  </span>
                  <a
                    href={data.currentLocation.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Open in Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-zinc-400 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-red-400" /> Resolving current coordinates...
              </div>
            )}
          </div>

          {/* Hotel Address Card */}
          <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                <Hotel className="w-3.5 h-3.5 text-amber-400" /> Booked Hotel Address
              </span>
              {data?.hotel?.phone && (
                <a
                  href={`tel:${data.hotel.phone}`}
                  className="text-xs text-amber-300 hover:underline flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" /> Call Reception
                </a>
              )}
            </div>

            {data?.hotel ? (
              <div className="space-y-1">
                <div className="text-base font-bold text-white flex items-center justify-between">
                  <span>{data.hotel.name}</span>
                  {data.hotel.distanceKm !== undefined && (
                    <span className="text-xs text-zinc-400 font-normal">~{data.hotel.distanceKm} km away</span>
                  )}
                </div>
                <div className="text-xs text-zinc-400">{data.hotel.address}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-2 border-zinc-700 text-zinc-300 hover:text-white"
                  onClick={() => handleSelectFacility("facility-hotel")}
                >
                  Route to Hotel
                </Button>
              </div>
            ) : (
              <div className="text-xs text-zinc-400 py-2">No accommodation logged for this trip.</div>
            )}
          </div>
        </div>

        {/* Facility Directories & Navigation Route */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
              Emergency Facilities & Verified Safe Havens
            </h2>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTab("hospital")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "hospital"
                    ? "bg-red-900/60 text-red-200 border border-red-700"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800"
                }`}
              >
                <Hospital className="w-3.5 h-3.5 text-red-400" />
                Hospitals ({data?.nearbyHospitals.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("police")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "police"
                    ? "bg-blue-900/60 text-blue-200 border border-blue-700"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Police ({data?.nearbyPoliceStations.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("pharmacy")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "pharmacy"
                    ? "bg-emerald-900/60 text-emerald-200 border border-emerald-700"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800"
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-emerald-400" />
                Pharmacies ({data?.nearbyPharmacies.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("embassy")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "embassy"
                    ? "bg-purple-900/60 text-purple-200 border border-purple-700"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                Embassies & Consulates ({data?.embassiesConsulates.length || 0})
              </button>
            </div>
          </div>

          {/* Facility List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeTab === "hospital" &&
              data?.nearbyHospitals.map((hosp) => (
                <FacilityCard
                  key={hosp.id}
                  facility={hosp}
                  isSelected={selectedFacilityId === hosp.id}
                  onSelect={() => handleSelectFacility(hosp.id)}
                />
              ))}

            {activeTab === "police" &&
              data?.nearbyPoliceStations.map((pol) => (
                <FacilityCard
                  key={pol.id}
                  facility={pol}
                  isSelected={selectedFacilityId === pol.id}
                  onSelect={() => handleSelectFacility(pol.id)}
                />
              ))}

            {activeTab === "pharmacy" &&
              data?.nearbyPharmacies.map((pharm) => (
                <FacilityCard
                  key={pharm.id}
                  facility={pharm}
                  isSelected={selectedFacilityId === pharm.id}
                  onSelect={() => handleSelectFacility(pharm.id)}
                />
              ))}

            {activeTab === "embassy" &&
              data?.embassiesConsulates.map((emb) => (
                <FacilityCard
                  key={emb.id}
                  facility={emb}
                  isSelected={selectedFacilityId === emb.id}
                  onSelect={() => handleSelectFacility(emb.id)}
                />
              ))}
          </div>
        </div>

        {/* Active Route to Selected Facility */}
        {data?.activeRoute && (
          <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-700 rounded-xl space-y-3.5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <NavigationIcon className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs text-zinc-400">Wayfinding Route to:</div>
                  <div className="text-base font-bold text-white">{data.activeRoute.facilityName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700 text-xs">
                  <button
                    onClick={() => setRouteMode("walking")}
                    className={`px-3 py-1 rounded flex items-center gap-1.5 ${
                      routeMode === "walking" ? "bg-emerald-600 text-white font-medium" : "text-zinc-400"
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" /> Walk
                  </button>
                  <button
                    onClick={() => setRouteMode("driving")}
                    className={`px-3 py-1 rounded flex items-center gap-1.5 ${
                      routeMode === "driving" ? "bg-emerald-600 text-white font-medium" : "text-zinc-400"
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" /> Drive / Cab
                  </button>
                </div>
                <Badge variant="outline" className="border-emerald-700 text-emerald-300 text-xs py-1">
                  {data.activeRoute.distanceKm} km • ~{data.activeRoute.durationMinutes} min (ETA {data.activeRoute.etaTimeString})
                </Badge>
              </div>
            </div>

            {/* Turn by turn steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.activeRoute.steps.map((st, i) => (
                <div key={st.id || i} className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg flex items-start gap-2.5 text-xs text-zinc-300">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-[11px] text-zinc-400 shrink-0 font-mono">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-white">{st.instruction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Contacts & Location Sharing */}
        <div className="p-5 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" /> Share My Location with Emergency Contacts
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Select contacts below to dispatch your live coordinates, nearest hospital, and hotel address.
              </p>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              {selectedContactIds.length} contact(s) selected
            </span>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data?.emergencyContacts.map((contact) => {
              const isSelected = selectedContactIds.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => toggleContactSelection(contact.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-blue-950/70 border-blue-600 text-blue-200"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-zinc-700"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-xs">{contact.name}</div>
                      <div className="text-[10px] text-zinc-400">{contact.relationship}</div>
                    </div>
                  </div>
                  <span className="font-mono text-zinc-300 text-xs">{contact.phone}</span>
                </button>
              );
            })}
          </div>

          {/* Location Broadcast Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <Button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-4"
            >
              <Share2 className="w-4 h-4 mr-2" /> Share via WhatsApp
            </Button>

            <Button
              onClick={handleShareSms}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-10 px-4"
            >
              <Radio className="w-4 h-4 mr-2" /> Send SOS SMS
            </Button>

            <Button
              variant="outline"
              onClick={handleCopyDistressMessage}
              className="border-zinc-700 text-zinc-200 hover:text-white text-xs h-10 px-4"
            >
              {copiedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" /> Copy Full SOS Card
                </>
              )}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}

function FacilityCard({
  facility,
  isSelected,
  onSelect,
}: {
  facility: EmergencyFacility;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const getIcon = (type: EmergencyFacilityType) => {
    switch (type) {
      case "hospital":
        return <Hospital className="w-4 h-4 text-red-400" />;
      case "police":
        return <Shield className="w-4 h-4 text-blue-400" />;
      case "pharmacy":
        return <Pill className="w-4 h-4 text-emerald-400" />;
      case "embassy":
        return <Building2 className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? "bg-zinc-900 border-red-500 shadow-lg shadow-red-950/40"
          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-zinc-800">{getIcon(facility.type)}</div>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{facility.name}</h3>
              <p className="text-xs text-zinc-400 line-clamp-1">{facility.category}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-xs font-mono shrink-0">
            {facility.distanceKm} km
          </Badge>
        </div>

        <p className="text-xs text-zinc-400 line-clamp-2">{facility.address}</p>

        {facility.operatingHours && (
          <div className="text-xs text-zinc-500 flex items-center gap-1.5 pt-1">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{facility.operatingHours}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 mt-3 border-t border-zinc-800/80">
        <a
          href={`tel:${facility.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1.5"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{facility.phone}</span>
        </a>

        <div className="flex items-center gap-1 text-xs text-blue-400 font-medium hover:text-blue-300">
          <span>Navigate</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
