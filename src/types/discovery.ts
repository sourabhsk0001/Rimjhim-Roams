import { Destination, WeatherForecast } from "./travel";
import { TravellerType } from "./database";

export interface DestinationDiscoveryInput {
  origin: string;
  budget: number;
  currency?: string;
  durationDays: number;
  travellerCount: number;
  travellerType?: TravellerType;
  preferences?: string[] | string;
}

export interface DiscoveredDestinationResult {
  destination: Destination;
  matchScore: number;
  matchReasons: string[];
  estimatedTotalCost: number;
  estimatedTotalCostFormatted: string;
  budgetSurplusDeficit: number;
  budgetSurplusDeficitFormatted: string;
  isWithinBudget: boolean;

  // Breakdown using BudgetEngine
  transportCost: number;
  transportCostFormatted: string;
  hotelCost: number;
  hotelCostFormatted: string;
  foodCost: number;
  foodCostFormatted: string;
  activitiesCost: number;
  activitiesCostFormatted: string;
  localTransportCost: number;
  localTransportCostFormatted: string;
  emergencyBufferCost: number;
  emergencyBufferCostFormatted: string;

  recommendedDays: number;
  approximateTravelTime: string;
  travelModeSummary: string;
  majorAttractions: Array<{
    name: string;
    category: string;
    ticketPrice: number;
  }>;
  weather: WeatherForecast | null;

  isEstimate: true;
  estimateDisclaimer: string;
}

export interface DestinationDiscoveryResponse {
  success: boolean;
  query: DestinationDiscoveryInput;
  destinations: DiscoveredDestinationResult[];
  totalEvaluated: number;
  totalFeasible: number;
  message?: string;
}
