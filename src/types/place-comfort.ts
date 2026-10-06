/**
 * "Is This Place Safe for Me?" — Travel Comfort & Safety Profile Domain Types
 * Surfaces transparent public signals instead of opaque AI-generated "safety scores".
 */

export type ComfortSignalLevel = "green" | "yellow" | "red";

export interface ComfortSignal {
  id: "crowd_level" | "late_night_access" | "transport" | "tourist_density" | "weather_concern";
  label: string;
  level: ComfortSignalLevel;
  iconEmoji: "🟢" | "🟡" | "🔴";
  statusText: string;
  detail: string;
  source: string;
  retrieved_at: string;
}

export interface BetterVisitWindow {
  timeWindow: string; // e.g. "9:00 AM – 6:00 PM"
  headline: string;
  reason: string;
  crowdContext: string;
  illuminationContext: string;
}

export interface PlaceComfortProfile {
  placeId: string;
  placeName: string;
  category: string;
  areaName: string;
  destination: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  betterTimeToVisit: BetterVisitWindow;
  signals: ComfortSignal[];
  summaryNote: string;
  transparencyNotice: {
    rule: string;
    description: string;
    isDecisionSupportOnly: boolean;
  };
  verifiedSources: {
    name: string;
    authority: string;
    coverage: string;
  }[];
  generated_at: string;
}
