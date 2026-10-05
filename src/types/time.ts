// ==============================================================================
// Time Intelligence Engine Domain Types
// ==============================================================================

export type DurationTier = "Quick" | "Normal" | "Relaxed";

export type ItineraryItemCategory =
  | "sightseeing"
  | "food"
  | "travel"
  | "rest"
  | "activity"
  | "lodging";

export type ItemPriority = "must_visit" | "high" | "medium" | "low";

export interface ItemLocation {
  latitude: number;
  longitude: number;
  name: string;
  address?: string;
}

/**
 * CRITICAL ARCHITECTURAL REQUIREMENT:
 * visit_minutes, travel_minutes, waiting_minutes, and buffer_minutes
 * MUST BE KEPT STRICTLY SEPARATE. They must NEVER be combined internally.
 */
export interface ItineraryItem {
  id: string;
  itinerary_id: string;
  trip_id: string;
  attraction_id?: string | null;
  title: string;
  category: ItineraryItemCategory;
  date: string;
  start_time: string; // HH:MM (24-hour)
  end_time: string;   // HH:MM (24-hour)
  location: ItemLocation;

  // Discrete, unmerged time components:
  visit_minutes: number;
  travel_minutes: number;
  waiting_minutes: number;
  buffer_minutes: number;

  estimated_cost: number;
  priority: ItemPriority;
  status: "scheduled" | "completed" | "skipped";
  duration_tier: DurationTier;
  sort_order: number;
  opening_time?: string;
  closing_time?: string;
}

export interface DayItineraryData {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string;
  theme?: string;
  day_start_time: string; // e.g. "08:30"
  day_end_time: string;   // e.g. "21:00"
  items: ItineraryItem[];
}

export interface DailyTimeAllocation {
  availableMinutes: number;   // Unscheduled free waking time
  travelMinutes: number;      // Total transit between locations
  sightseeingMinutes: number; // Total pure visit/viewing time
  foodMinutes: number;        // Meals (Breakfast/Lunch/Dinner/Tea)
  restMinutes: number;        // Rest breaks & downtime
  waitingMinutes: number;     // Queues & admission processing
  bufferMinutes: number;      // Contingency & traffic pads
  totalAllocatedMinutes: number;
  dayCapacityMinutes: number; // Total active hours from start to end
}

export type ScheduleValidationErrorType =
  | "attraction_closed"
  | "insufficient_time"
  | "overlapping_activities"
  | "impossible_travel"
  | "excessive_daily_schedule";

export interface ScheduleValidationError {
  id: string;
  type: ScheduleValidationErrorType;
  severity: "error" | "warning";
  message: string;
  itemIds: string[];
  suggestedFix: string;
  alternative?: {
    actionType: "reorder" | "shift_time" | "switch_tier" | "move_day" | "insert_rest";
    description: string;
  };
}

export interface ScheduleValidationResult {
  isValid: boolean;
  errors: ScheduleValidationError[];
  warnings: ScheduleValidationError[];
  allocation: DailyTimeAllocation;
}

export interface OptimizeDayResult {
  success: boolean;
  optimizedItems: ItineraryItem[];
  changesMade: string[];
  validation: ScheduleValidationResult;
}

export interface VisitCalculationParams {
  minimumVisitMinutes: number;
  recommendedVisitMinutes: number;
  maximumVisitMinutes: number;
  durationTier?: DurationTier;
  travellerType?: string; // "solo" | "couple" | "family" | "friends" | "business"
  travelPace?: string;    // "relaxed" | "moderate" | "fast-paced"
  userPreferences?: string[];
  openingTime?: string;
  closingTime?: string;
  remainingDayMinutes?: number;
  estimatedQueueMinutes?: number;
  weatherCondition?: string;
  isSunsetOrSunriseViewpoint?: boolean;
}
