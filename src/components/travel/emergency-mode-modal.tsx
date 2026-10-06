"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AlertOctagon,
  PhoneCall,
  Hospital,
  Shield,
  Pill,
  Building2,
  MapPin,
  Navigation,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  Clock,
  ArrowRight,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  HeartPulse,
  Compass,
  X,
  Hotel,
  Car,
  Footprints,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  EmergencyModeResult,
  EmergencyFacility,
  EmergencyFacilityType,
  EmergencyContact,
} from "@/types/emergency-mode";

interface EmergencyModeModalProps {
  tripId: string;
  isOpen: boolean;
  onClose: () => void;
  destinationName?: string;
}

export function EmergencyModeModal({
  tripId,
  isOpen,
  onClose,
  destinationName = "Destination",
}: EmergencyModeModalProps) {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EmergencyModeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active facility tab: "hospital" | "police" | "pharmacy" | "embassy" | "hotel"
  const [activeTab, setActiveTab] = useState<EmergencyFacilityType | "hotel">("hospital");

  // Selected route facility ID
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  // Selected contacts for location sharing
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Navigation mode
  const [routeMode, setRouteMode] = useState<"walking" | "driving">("walking");

  // Geolocation tracking
  const [gpsLoading, setGpsLoading] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Load emergency data
  const loadEmergencyData = useCallback(
    async (coords?: { latitude: number; longitude: number; accuracy?: number }, targetId?: string) => {
      try {
        setLoading(true);
        setError(null);

        let url = `/api/trips/${tripId}/emergency`;
        const params = new URLSearchParams();
        if (coords) {
          params.append("latitude", coords.latitude.toString());
          params.append("longitude", coords.longitude.toString());
          if (coords.accuracy) params.append("accuracy", coords.accuracy.toString());
        }
        if (targetId) {
          params.append("facilityId", targetId);
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Failed to load emergency data.");
        }

        setData(json);
        if (targetId) setSelectedFacilityId(targetId);
        else if (json.nearestFacility) setSelectedFacilityId(json.nearestFacility.id);

        // Pre-select all primary emergency contacts
        if (json.emergencyContacts && json.emergencyContacts.length > 0) {
          const selected = json.emergencyContacts
            .filter((c: EmergencyContact) => c.isSelected || c.isPrimary)
            .map((c: EmergencyContact) => c.id);
          setSelectedContactIds(selected.length > 0 ? selected : [json.emergencyContacts[0].id]);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load emergency data.");
      } finally {
        setLoading(false);
      }
    },
    [tripId]
  );

  // Fetch live GPS coordinates
  const refreshLiveGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unsupported",
        description: "Browser geolocation is not available on this device.",
        variant: "error",
      });
      loadEmergencyData();
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
          description: `Locked to ±${Math.round(pos.coords.accuracy)}m accuracy.`,
        });
        loadEmergencyData(coords, selectedFacilityId || undefined);
      },
      (err) => {
        setGpsLoading(false);
        toast({
          title: "GPS Access Restricted",
          description: "Using simulated off-route destination coordinates.",
        });
        loadEmergencyData(undefined, selectedFacilityId || undefined);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [loadEmergencyData, selectedFacilityId, toast]);

  useEffect(() => {
    if (isOpen) {
      refreshLiveGps();
    }
  }, [isOpen, refreshLiveGps]);

  // Toggle contact selection
  const toggleContactSelection = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  // Switch facility target for routing
  const handleSelectFacility = (facilityId: string, facilityType: EmergencyFacilityType | "hotel") => {
    setSelectedFacilityId(facilityId);
    if (data?.currentLocation) {
      loadEmergencyData(
        {
          latitude: data.currentLocation.latitude,
          longitude: data.currentLocation.longitude,
          accuracy: data.currentLocation.accuracyMeters,
        },
        facilityId
      );
    }
  };

  // One-click Share Location via WhatsApp
  const handleShareWhatsApp = () => {
    if (!data) return;
    const text = encodeURIComponent(data.shareableDistressMessage);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // One-click Share Location via SMS
  const handleShareSms = () => {
    if (!data) return;
    const selectedPhones = data.emergencyContacts
      .filter((c) => selectedContactIds.includes(c.id))
      .map((c) => c.phone.replace(/\s+/g, ""))
      .join(",");
    const text = encodeURIComponent(data.shareableDistressMessage);
    window.location.href = `sms:${selectedPhones}?&body=${text}`;
  };

  // One-click Copy Text
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
        description: "Please manually highlight and copy the text.",
        variant: "error",
      });
    }
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (!data || !navigator.share) {
      handleCopyDistressMessage();
      return;
    }
    try {
      await navigator.share({
        title: `🚨 Emergency Location - ${data.destination}`,
        text: data.shareableDistressMessage,
        url: data.currentLocation.mapsUrl,
      });
    } catch {
      // User cancelled
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-dialog-title"
    >
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-red-800/80 rounded-2xl shadow-2xl overflow-hidden my-4 text-zinc-100 flex flex-col max-h-[92vh]">
        
        {/* Top Emergency Action Header */}
        <div className="bg-gradient-to-r from-red-950 via-red-900 to-zinc-950 px-4 sm:px-6 py-4 border-b border-red-800/60 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600 rounded-xl shadow-lg shadow-red-600/40 animate-pulse text-white">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="emergency-dialog-title" className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  EMERGENCY MODE
                </h2>
                <Badge variant="destructive" className="bg-red-700 font-mono text-xs uppercase animate-pulse">
                  Priority 1
                </Badge>
              </div>
              <p className="text-xs text-red-200">
                Decision Support & Immediate Facility Wayfinding for <span className="font-semibold text-white">{destinationName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            aria-label="Close Emergency Mode"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1 text-sm">
          
          {/* Decision-Support Invariant Banner */}
          <div className="p-3.5 bg-red-950/60 border border-red-700/80 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200 leading-relaxed">
              <span className="font-bold text-red-100 uppercase tracking-wide block mb-0.5">
                Decision Support System Only — Not an Emergency Dispatch Service
              </span>
              In immediate life-threatening danger, cardiac event, or severe accident, <strong>call 112 or 108 directly</strong>. This tool provides offline facility directories, routing, and location broadcast to aid quick decision-making.
            </div>
          </div>

          {/* Quick Dial National Helplines Bar */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-red-400" /> Instant One-Tap Emergency Helplines
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href="tel:112"
                className="flex items-center justify-between p-3 bg-red-900/40 hover:bg-red-900/70 border border-red-700/80 rounded-xl text-white transition-all group"
              >
                <div>
                  <div className="text-xs text-red-300 font-medium">All-India Universal</div>
                  <div className="text-lg font-black text-white group-hover:scale-105 transition-transform">112</div>
                </div>
                <div className="p-2 bg-red-600 rounded-lg group-hover:bg-red-500">
                  <PhoneCall className="w-4 h-4 text-white" />
                </div>
              </a>

              <a
                href="tel:108"
                className="flex items-center justify-between p-3 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-700/80 rounded-xl text-white transition-all group"
              >
                <div>
                  <div className="text-xs text-emerald-300 font-medium">Ambulance / Medical</div>
                  <div className="text-lg font-black text-white group-hover:scale-105 transition-transform">108</div>
                </div>
                <div className="p-2 bg-emerald-600 rounded-lg group-hover:bg-emerald-500">
                  <HeartPulse className="w-4 h-4 text-white" />
                </div>
              </a>

              <a
                href="tel:100"
                className="flex items-center justify-between p-3 bg-blue-950/40 hover:bg-blue-950/70 border border-blue-700/80 rounded-xl text-white transition-all group"
              >
                <div>
                  <div className="text-xs text-blue-300 font-medium">Police Control Room</div>
                  <div className="text-lg font-black text-white group-hover:scale-105 transition-transform">100</div>
                </div>
                <div className="p-2 bg-blue-600 rounded-lg group-hover:bg-blue-500">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </a>

              <a
                href="tel:1363"
                className="flex items-center justify-between p-3 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-700/80 rounded-xl text-white transition-all group"
              >
                <div>
                  <div className="text-xs text-amber-300 font-medium">Tourist Helpline (24/7)</div>
                  <div className="text-lg font-black text-white group-hover:scale-105 transition-transform">1363</div>
                </div>
                <div className="p-2 bg-amber-600 rounded-lg group-hover:bg-amber-500">
                  <PhoneCall className="w-4 h-4 text-white" />
                </div>
              </a>
            </div>
          </div>

          {/* Location & Hotel Quick Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Live Location Card */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> Current Location
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-zinc-400 hover:text-white px-2"
                  onClick={refreshLiveGps}
                  disabled={gpsLoading}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${gpsLoading ? "animate-spin" : ""}`} />
                  {gpsLoading ? "Locking..." : "Refresh GPS"}
                </Button>
              </div>

              {data?.currentLocation ? (
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{data.currentLocation.landmarkDescription}</span>
                    <Badge variant="outline" className="text-[10px] py-0 border-zinc-700 text-zinc-300 font-mono">
                      {data.currentLocation.isSimulated ? "Simulated" : `±${Math.round(data.currentLocation.accuracyMeters || 10)}m`}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono text-zinc-400 mt-1 flex items-center justify-between">
                    <span>
                      {data.currentLocation.latitude.toFixed(5)}, {data.currentLocation.longitude.toFixed(5)}
                    </span>
                    <a
                      href={data.currentLocation.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      Maps Pin <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 animate-pulse">Acquiring coordinate lock...</div>
              )}
            </div>

            {/* Hotel Address Card */}
            <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Hotel className="w-3.5 h-3.5 text-amber-400" /> Hotel Address
                </span>
                {data?.hotel?.phone && (
                  <a
                    href={`tel:${data.hotel.phone}`}
                    className="text-xs text-amber-300 hover:underline flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" /> Call Desk
                  </a>
                )}
              </div>

              {data?.hotel ? (
                <div>
                  <div className="text-sm font-bold text-white flex items-center justify-between">
                    <span>{data.hotel.name}</span>
                    {data.hotel.distanceKm !== undefined && (
                      <span className="text-xs text-zinc-400 font-normal">~{data.hotel.distanceKm} km away</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{data.hotel.address}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[11px] mt-2 border-zinc-700 text-zinc-300 hover:text-white"
                    onClick={() => handleSelectFacility("facility-hotel", "hotel")}
                  >
                    Route to Hotel
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-zinc-400">No accommodation logged for this trip.</div>
              )}
            </div>
          </div>

          {/* Facility Directories & Navigation Route */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Emergency Facilities & Safe Havens
              </h3>
              
              {/* Category selector pills */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("hospital")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    activeTab === "hospital"
                      ? "bg-red-900/60 text-red-200 border border-red-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Hospital className="w-3.5 h-3.5 text-red-400" />
                  Hospitals
                </button>
                <button
                  onClick={() => setActiveTab("police")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    activeTab === "police"
                      ? "bg-blue-900/60 text-blue-200 border border-blue-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  Police
                </button>
                <button
                  onClick={() => setActiveTab("pharmacy")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    activeTab === "pharmacy"
                      ? "bg-emerald-900/60 text-emerald-200 border border-emerald-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Pill className="w-3.5 h-3.5 text-emerald-400" />
                  Pharmacies
                </button>
                <button
                  onClick={() => setActiveTab("embassy")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    activeTab === "embassy"
                      ? "bg-purple-900/60 text-purple-200 border border-purple-700"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  Embassies
                </button>
              </div>
            </div>

            {/* Facilities List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeTab === "hospital" &&
                data?.nearbyHospitals.map((hosp) => (
                  <FacilityCard
                    key={hosp.id}
                    facility={hosp}
                    isSelected={selectedFacilityId === hosp.id}
                    onSelect={() => handleSelectFacility(hosp.id, "hospital")}
                  />
                ))}

              {activeTab === "police" &&
                data?.nearbyPoliceStations.map((pol) => (
                  <FacilityCard
                    key={pol.id}
                    facility={pol}
                    isSelected={selectedFacilityId === pol.id}
                    onSelect={() => handleSelectFacility(pol.id, "police")}
                  />
                ))}

              {activeTab === "pharmacy" &&
                data?.nearbyPharmacies.map((pharm) => (
                  <FacilityCard
                    key={pharm.id}
                    facility={pharm}
                    isSelected={selectedFacilityId === pharm.id}
                    onSelect={() => handleSelectFacility(pharm.id, "pharmacy")}
                  />
                ))}

              {activeTab === "embassy" &&
                data?.embassiesConsulates.map((emb) => (
                  <FacilityCard
                    key={emb.id}
                    facility={emb}
                    isSelected={selectedFacilityId === emb.id}
                    onSelect={() => handleSelectFacility(emb.id, "embassy")}
                  />
                ))}
            </div>
          </div>

          {/* Active Navigation Route to Nearest / Selected Facility */}
          {data?.activeRoute && (
            <div className="p-4 bg-zinc-900/90 border border-zinc-700 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-sm">
                    Wayfinding Route to: <span className="text-emerald-300">{data.activeRoute.facilityName}</span>
                  </span>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex bg-zinc-800 p-0.5 rounded-lg border border-zinc-700 text-xs">
                    <button
                      onClick={() => setRouteMode("walking")}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                        routeMode === "walking" ? "bg-emerald-600 text-white font-medium" : "text-zinc-400"
                      }`}
                    >
                      <Footprints className="w-3 h-3" /> Walk
                    </button>
                    <button
                      onClick={() => setRouteMode("driving")}
                      className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                        routeMode === "driving" ? "bg-emerald-600 text-white font-medium" : "text-zinc-400"
                      }`}
                    >
                      <Car className="w-3 h-3" /> Drive
                    </button>
                  </div>
                  <Badge variant="outline" className="border-emerald-700 text-emerald-300 text-xs">
                    {data.activeRoute.distanceKm} km • ~{data.activeRoute.durationMinutes} min (ETA {data.activeRoute.etaTimeString})
                  </Badge>
                </div>
              </div>

              {/* Step Directions */}
              <div className="space-y-1.5">
                {data.activeRoute.steps.map((st, i) => (
                  <div key={st.id || i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-zinc-800 text-[10px] text-zinc-400 shrink-0 font-mono">
                      {i + 1}
                    </span>
                    <span className="flex-1">{st.instruction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Contacts & Location Sharing Deck */}
          <div className="p-4 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Share My Location with Emergency Contacts
              </h3>
              <span className="text-xs text-zinc-500">
                {selectedContactIds.length} contact(s) selected
              </span>
            </div>

            {/* Contact selector chips */}
            <div className="flex flex-wrap gap-2">
              {data?.emergencyContacts.map((contact) => {
                const isSelected = selectedContactIds.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContactSelection(contact.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      isSelected
                        ? "bg-blue-950/80 border-blue-600 text-blue-200"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded flex items-center justify-center border ${
                        isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-zinc-700"
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="font-semibold text-white">{contact.name}</span>
                    <span className="text-[10px] text-zinc-400">({contact.relationship})</span>
                    <span className="font-mono text-zinc-300 text-[11px]">{contact.phone}</span>
                  </button>
                );
              })}
            </div>

            {/* Share Broadcast Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                onClick={handleShareWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 flex-1 sm:flex-none"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share via WhatsApp
              </Button>

              <Button
                onClick={handleShareSms}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 flex-1 sm:flex-none"
              >
                <Radio className="w-3.5 h-3.5 mr-1.5" /> Send SOS SMS
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyDistressMessage}
                className="border-zinc-700 text-zinc-200 hover:text-white text-xs h-9 flex-1 sm:flex-none"
              >
                {copiedSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy SOS Message
                  </>
                )}
              </Button>

              {typeof navigator !== "undefined" && "share" in navigator && (
                <Button
                  variant="outline"
                  onClick={handleNativeShare}
                  className="border-zinc-700 text-zinc-200 hover:text-white text-xs h-9"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-950 px-4 sm:px-6 py-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>In immediate danger: Call <strong>112</strong></span>
          <Button size="sm" variant="outline" className="h-8 border-zinc-700 text-zinc-300" onClick={onClose}>
            Close Emergency Mode
          </Button>
        </div>

      </div>
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
      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? "bg-zinc-900 border-red-500 shadow-md shadow-red-950/40"
          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-800">{getIcon(facility.type)}</div>
            <div>
              <h4 className="text-sm font-bold text-white line-clamp-1">{facility.name}</h4>
              <p className="text-[11px] text-zinc-400 line-clamp-1">{facility.category}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px] font-mono shrink-0">
            {facility.distanceKm} km
          </Badge>
        </div>

        <p className="text-xs text-zinc-400 mt-2 line-clamp-1">{facility.address}</p>

        {facility.operatingHours && (
          <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{facility.operatingHours}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800/80">
        <a
          href={`tel:${facility.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
        >
          <PhoneCall className="w-3 h-3" />
          <span>{facility.phone}</span>
        </a>

        <div className="flex items-center gap-1 text-xs text-blue-400 font-medium hover:text-blue-300">
          <span>Navigate</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}
