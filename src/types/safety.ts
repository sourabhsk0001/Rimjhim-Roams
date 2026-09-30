// ==============================================================================
// Phase 13: Source-Backed Safety Center & Emergency Mode Domain Types
// Strict Rule: No arbitrary safety scores. No fabricated alerts.
// Every record includes source, retrieved_at, and updated_at.
// ==============================================================================

export type EmergencyCategory =
  | "universal"
  | "police"
  | "medical"
  | "tourist"
  | "women"
  | "fire"
  | "disaster";

export interface EmergencyNumber {
  id: string;
  name: string;
  number: string;
  category: EmergencyCategory;
  description: string;
  tollFree: boolean;
  languages?: string[];
  source: string;
  retrieved_at: string;
  updated_at?: string;
}

export type FacilityType = "hospital" | "police";

export interface HospitalFacility {
  id: string;
  destination: string;
  name: string;
  category:
    | "Government Medical College & Trauma Center"
    | "District Hospital"
    | "Community Health Center"
    | "Multispecialty Hospital";
  has24x7Emergency: boolean;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  source: string;
  retrieved_at: string;
  updated_at?: string;
}

export interface PoliceFacility {
  id: string;
  destination: string;
  name: string;
  category: "Tourist Police Unit" | "Local Police Station" | "Coastal Police" | "Highway Patrol";
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  source: string;
  retrieved_at: string;
  updated_at?: string;
}

export type AlertSeverity = "advisory" | "warning" | "severe";

export interface WeatherAlert {
  id: string;
  destination: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  effectiveFrom: string;
  effectiveUntil: string;
  source: string;
  retrieved_at: string;
  updated_at?: string;
}

export interface TravelAdvisory {
  id: string;
  destination: string;
  category: "safety" | "health" | "cultural_norms" | "permits" | "environment";
  title: string;
  content: string;
  severity: "low" | "medium" | "high";
  source: string;
  retrieved_at: string;
  updated_at?: string;
}

export type DisruptionType = "road" | "ferry" | "rail" | "airport" | "trek";
export type DisruptionStatus = "operational" | "delayed" | "closed" | "seasonal_closure";

export interface TransportDisruption {
  id: string;
  destination: string;
  type: DisruptionType;
  title: string;
  details: string;
  status: DisruptionStatus;
  source: string;
  retrieved_at: string;
  updated_at?: string;
}

export interface LocalRule {
  id: string;
  destination: string;
  topic: string;
  rule: string;
  statutoryReference?: string;
  penalty?: string;
  source: string;
  retrieved_at: string;
  updated_at?: string;
}

export interface DestinationSafetyCenter {
  destination: string;
  emergencyNumbers: EmergencyNumber[];
  hospitals: HospitalFacility[];
  policeStations: PoliceFacility[];
  weatherAlerts: WeatherAlert[];
  travelAdvisories: TravelAdvisory[];
  transportDisruptions: TransportDisruption[];
  localRules: LocalRule[];
  disclaimer: string;
  retrieved_at: string;
}

export interface TripEmergencyCard {
  tripId: string;
  destination: string;
  dates: string;
  travelerCount: number;
  hotelName?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  emergencyHelpline: string;
  touristHelpline: string;
  nearestHospital?: HospitalFacility | null;
  nearestPolice?: PoliceFacility | null;
  userLiveCoordinates?: {
    latitude: number;
    longitude: number;
    mapsUrl: string;
  } | null;
  shareableSummaryText: string;
  sourceNotice: string;
  generated_at: string;
}
