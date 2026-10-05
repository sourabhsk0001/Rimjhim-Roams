// ==============================================================================
// Weather Intelligence & Itinerary Integration Domain Types
// ==============================================================================

export type WeatherConfidenceTier =
  | "high_confidence"     // 0 - 2 days (Short-range operational forecast)
  | "moderate_confidence" // 3 - 7 days (Medium-range ensemble model)
  | "seasonal_guidance";  // > 7 days (Extended climate projection / high uncertainty)

export interface CurrentWeather {
  temperature: number;             // °C
  apparentTemperature: number;     // °C ("Feels like")
  condition: string;               // e.g. "Clear Sky", "Rainy", "Partly Cloudy"
  weatherCode: number;             // WMO weather interpretation code
  windSpeed: number;               // km/h
  windDirection: number;           // degrees (0-360)
  precipitationProbability: number;// % (0-100)
  humidity: number;                // % (0-100)
  uvIndex: number;                 // UV index (0-11+)
  time: string;                    // ISO timestamp
  isDay: boolean;
}

export interface HourlyWeather {
  time: string;                    // ISO string or HH:MM
  hour: number;                    // 0 - 23
  temperature: number;             // °C
  apparentTemperature: number;     // °C
  precipitationProbability: number;// % (0-100)
  precipitation: number;           // mm
  weatherCode: number;
  condition: string;
  windSpeed: number;               // km/h
  windDirection: number;
  humidity: number;
  uvIndex: number;
  isDay: boolean;
}

export interface DailyWeather {
  date: string;                    // YYYY-MM-DD
  tempMin: number;                 // °C
  tempMax: number;                 // °C
  condition: string;
  precipitationProbability: number;// % (0-100)
  precipitationSum: number;        // mm
  windSpeedMax: number;            // km/h
  sunrise: string;                 // ISO string or HH:MM
  sunset: string;                  // ISO string or HH:MM
  weatherCode: number;
  confidenceTier: WeatherConfidenceTier;
}

export interface WeatherForecastResponse {
  locationName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  daily: DailyWeather[];
  hourly: HourlyWeather[];
  isCached: boolean;
  isFallback: boolean;
  fetchedAt: string;
  provider: string;                // "Open-Meteo" | "Climatology Fallback"
  disclaimer: string;
}

export interface HistoricalWeatherResponse {
  locationName: string;
  latitude: number;
  longitude: number;
  date: string;                    // YYYY-MM-DD
  tempMin: number;
  tempMax: number;
  condition: string;
  precipitation: number;           // mm
  windSpeedMax: number;            // km/h
  weatherCode: number;
  source: "historical_api" | "climatological_average";
}

export interface WeatherSnapshot {
  id: string;
  trip_id: string;
  destination_id?: string;
  latitude: number;
  longitude: number;
  date: string;                    // YYYY-MM-DD
  snapshot_data: WeatherForecastResponse;
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------------------
// Weather-Itinerary Integration Types
// ------------------------------------------------------------------------------

export type WeatherConflictAction =
  | "reschedule_time"   // Shift activity to a dry hour on the same day (e.g. 3 PM -> 5 PM)
  | "replace_indoor"     // Swap outdoor activity with an indoor attraction
  | "move_day"          // Suggest swapping with a dry day in multi-day trip
  | "no_action_needed";

export interface WeatherConflictResolution {
  id: string;
  itemId: string;
  itemTitle: string;
  dayNumber: number;
  date: string;
  originalStartTime: string;
  originalEndTime: string;
  rainProbability: number;
  weatherCondition: string;
  conflictReason: string;
  action: WeatherConflictAction;
  newStartTime?: string;
  newEndTime?: string;
  replacementAttraction?: {
    id: string;
    name: string;
    category: string;
    weatherSuitability: string;
    ticketPrice: number;
  };
  explanation: string;
}

export interface WeatherItineraryIntegrationResult {
  tripId: string;
  analyzedDaysCount: number;
  conflictsDetected: number;
  resolutions: WeatherConflictResolution[];
  updatedDaysCount: number;
  summary: string;
}
