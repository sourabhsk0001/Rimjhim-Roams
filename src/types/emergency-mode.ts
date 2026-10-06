/**
 * "🚨 Emergency Mode" Domain Types
 * Decision-support emergency assistance, facility directories,
 * hotel and contact resolution, and location broadcast.
 */

export type EmergencyFacilityType = "hospital" | "police" | "pharmacy" | "embassy";

export interface EmergencyFacility {
  id: string;
  name: string;
  type: EmergencyFacilityType;
  category: string;
  has24x7Emergency: boolean;
  address: string;
  phone: string;
  alternatePhone?: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  distanceMeters: number;
  walkingMinutes: number;
  drivingMinutes: number;
  jurisdictionOrCountry?: string; // For embassy e.g. "United States", "United Kingdom", "France"
  operatingHours?: string;
  source: string;
  retrieved_at: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isSelected?: boolean;
}

export interface EmergencyHotelInfo {
  name: string;
  address: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
}

export interface EmergencyStep {
  id: string;
  instruction: string;
  distanceMeters: number;
  turnDirection: "straight" | "left" | "right" | "u_turn" | "destination";
}

export interface EmergencyFacilityRoute {
  facilityId: string;
  facilityName: string;
  facilityType: EmergencyFacilityType | "hotel";
  mode: "walking" | "driving";
  distanceKm: number;
  durationMinutes: number;
  etaTimeString: string;
  coordinates: [number, number][]; // [lng, lat] pairs for MapLibre / Leaflet
  steps: EmergencyStep[];
}

export interface EmergencyHelpline {
  id: string;
  name: string;
  number: string;
  category: "universal" | "police" | "medical" | "tourist" | "women" | "fire";
  description: string;
  tollFree: boolean;
}

export interface EmergencyModeResult {
  success: boolean;
  tripId: string;
  destination: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
    landmarkDescription: string;
    mapsUrl: string;
    isSimulated: boolean;
  };
  disclaimer: {
    title: string;
    message: string;
    urgentCallNumber: string;
    isDecisionSupportOnly: boolean;
  };
  hotel: EmergencyHotelInfo | null;
  nearbyHospitals: EmergencyFacility[];
  nearbyPoliceStations: EmergencyFacility[];
  nearbyPharmacies: EmergencyFacility[];
  embassiesConsulates: EmergencyFacility[];
  emergencyNumbers: EmergencyHelpline[];
  emergencyContacts: EmergencyContact[];
  nearestFacility: EmergencyFacility | null;
  activeRoute: EmergencyFacilityRoute | null;
  shareableDistressMessage: string;
  timestamp: string;
}
