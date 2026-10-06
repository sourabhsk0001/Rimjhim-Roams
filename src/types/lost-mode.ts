/**
 * "I'm Lost / What Now?" Emergency Wayfinding & Rescue Domain Types
 */

export interface SafePublicPlace {
  id: string;
  name: string;
  type: "police" | "hospital" | "transit_hub" | "public_cafe" | "tourist_desk";
  latitude: number;
  longitude: number;
  distanceMeters: number;
  distanceKm: number;
  walkingMinutes: number;
  address: string;
  phone?: string;
  is24x7: boolean;
  statusText: string;
  badgeLabel: string;
}

export interface NavigationStep {
  id: string;
  instruction: string;
  distanceMeters: number;
  turnDirection: "straight" | "left" | "right" | "u_turn" | "destination";
  iconName: string;
}

export interface PlannedStopContext {
  id: string;
  name: string;
  type: "attraction" | "hotel" | "restaurant" | "transit";
  scheduledTime: string;
  latitude: number;
  longitude: number;
  address?: string;
  category?: string;
}

export interface LostModeNavigationResult {
  success: boolean;
  destinationName: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    name: string;
    accuracyMeters?: number;
    isSimulated: boolean;
  };
  plannedCurrentStop: PlannedStopContext;
  nextPlannedStop?: PlannedStopContext;
  distanceToTargetMeters: number;
  distanceToTargetKm: number;
  bearingCompass: string;
  primaryWalkingRoute: {
    distanceKm: number;
    durationMinutes: number;
    etaTimeString: string;
    coordinates: [number, number][]; // [lng, lat] pairs for MapLibre
    turnByTurnSteps: NavigationStep[];
  };
  alternativeDrivingRoute: {
    mode: "driving" | "cab";
    distanceKm: number;
    durationMinutes: number;
    etaTimeString: string;
    estimatedFareInr: number;
    coordinates: [number, number][];
  };
  nearbySafePlaces: SafePublicPlace[];
  aiGuidance: {
    headline: string;
    plainExplanation: string;
    stepByStepAdvice: string[];
    safetyTip: string;
    quickHelpline: string;
  };
  shareableDistressMessage: string;
  generatedAt: string;
}
