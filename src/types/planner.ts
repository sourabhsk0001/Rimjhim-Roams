import { Destination, Attraction, Hotel, Restaurant, TransportOption, TaxiOption } from "./travel";
import { ItineraryItem, ScheduleValidationResult, DurationTier } from "./time";
import { BudgetCategory } from "./budget";
import { DailyWeather, WeatherForecastResponse } from "./weather";

export type PlanningProgressStep =
  | "finding_places"
  | "finding_hotel"
  | "calculating_transport"
  | "optimizing_route"
  | "calculating_budget"
  | "building_itinerary";

export interface PlannerStepInfo {
  step: PlanningProgressStep;
  label: string;
  detail: string;
  completed: boolean;
}

export interface SelectedHotelPlan {
  selected: Hotel;
  roomCount: number;
  nights: number;
  pricePerNight: number;
  totalCost: number;
  totalCostFormatted: string;
  reason: string;
}

export interface SelectedTransportPlan {
  outbound: TransportOption | TaxiOption;
  returnOption?: TransportOption | TaxiOption;
  localTransitMode: string;
  intercityCost: number;
  localCost: number;
  totalCost: number;
  totalCostFormatted: string;
  travelerCount: number;
}

export interface SelectedMealPlan {
  dayNumber: number;
  mealType: "lunch" | "dinner";
  restaurant: Restaurant;
  estimatedCost: number;
  timeSlot: string;
}

export interface SelectedAttractionPlan {
  attraction: Attraction;
  dayNumber: number;
  durationTier: DurationTier;
  visitMinutes: number;
  queueMinutes: number;
  ticketPrice: number;
}

export interface PlannedDayItinerary {
  dayNumber: number;
  date: string;
  theme: string;
  dayStartTime: string;
  dayEndTime: string;
  items: ItineraryItem[];
  routeCoordinates: [number, number][]; // [lng, lat] for Leaflet
  totalVisitMinutes: number;
  totalTravelMinutes: number;
  totalWaitingMinutes: number;
  totalBufferMinutes: number;
  validation: ScheduleValidationResult;
  weather?: DailyWeather;
}

export interface PlannedTripResult {
  success: boolean;
  tripId: string;
  title: string;
  destination: Destination;
  origin: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travellerCount: number;
  travellerType: string;
  travelPace: string;
  hotel: SelectedHotelPlan;
  transport: SelectedTransportPlan;
  food: {
    meals: SelectedMealPlan[];
    totalCost: number;
    totalCostFormatted: string;
  };
  attractions: SelectedAttractionPlan[];
  itinerary: PlannedDayItinerary[];
  weatherForecast?: WeatherForecastResponse;
  budget: {
    allocatedBudget: number;
    totalCost: number;
    remainingBudget: number;
    isOverBudget: boolean;
    overBudgetPercentage: number;
    currency: string;
    categories: Record<
      BudgetCategory,
      { amount: number; percentage: number; formatted: string }
    >;
  };
  optimization: {
    wasOptimized: boolean;
    originalCost: number;
    optimizedCost: number;
    appliedAdjustments: string[];
  };
  planningSteps: PlannerStepInfo[];
  createdAt: string;
}

export interface TripPlannerInput {
  tripId: string;
  userId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate?: string;
  durationDays?: number;
  budget?: number;
  currency?: string;
  travellerCount?: number;
  travellerType?: string;
  travelPace?: "relaxed" | "moderate" | "fast";
  preferences?: Record<string, unknown> | string[];
}
