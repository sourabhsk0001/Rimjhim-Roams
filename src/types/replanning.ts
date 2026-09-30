// ==============================================================================
// Phase 11: Real-time Itinerary Replanning Domain Types
// ==============================================================================

import {
  ItineraryItem,
  ItineraryItemCategory,
  ItemLocation,
  ScheduleValidationResult,
  DailyTimeAllocation,
} from "./time";
import { HourlyWeather } from "./weather";

export type ReplanChangeType =
  | "added"
  | "removed"
  | "moved"
  | "shortened"
  | "extended"
  | "unchanged";

export interface ReplanChange {
  id: string;
  type: ReplanChangeType;
  itemId: string;
  itemTitle: string;
  category: ItineraryItemCategory;
  reason: string;
  before?: {
    start_time: string;
    end_time: string;
    visit_minutes: number;
    travel_minutes?: number;
    buffer_minutes?: number;
    location?: ItemLocation;
  };
  after?: {
    start_time: string;
    end_time: string;
    visit_minutes: number;
    travel_minutes?: number;
    buffer_minutes?: number;
    location?: ItemLocation;
  };
}

export interface ReplanDayInput {
  tripId: string;
  dayNumber: number;
  currentDate?: string;
  currentTime?: string; // e.g. "14:45" (24h)
  delayMinutes?: number; // e.g. 45
  currentLocation?: ItemLocation;
  weatherForecast?: HourlyWeather[];
  completedItemIds?: string[];
  travelPace?: "relaxed" | "moderate" | "fast-paced";
  userPreferences?: string[];
  apply?: boolean; // Persist changes if true
  userId?: string;
}

export interface ReplanSummary {
  delayMinutes: number;
  currentTime: string;
  totalOriginalItems: number;
  totalReplannedItems: number;
  itemsPreserved: number;
  itemsRemoved: number;
  itemsAdded: number;
  itemsMoved: number;
  itemsShortened: number;
  itemsExtended: number;
}

export interface ReplanBudgetComparison {
  originalCost: number;
  replannedCost: number;
  costDifference: number;
  originalCostFormatted: string;
  replannedCostFormatted: string;
  costDifferenceFormatted: string;
  currency: string;
}

export interface ReplanDayResult {
  success: boolean;
  tripId: string;
  dayNumber: number;
  date: string;
  currentTime: string;
  delayMinutes: number;
  originalItems: ItineraryItem[];
  replannedItems: ItineraryItem[];
  changes: ReplanChange[];
  summary: ReplanSummary;
  validation: ScheduleValidationResult;
  timeAllocation: DailyTimeAllocation;
  budget: ReplanBudgetComparison;
  applied: boolean;
  error?: string;
}
