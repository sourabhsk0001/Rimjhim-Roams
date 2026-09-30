export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  name: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  location: LocationPoint;
  startTime: string;
  endTime: string;
  costEstimate?: {
    amount: number;
    currency: string;
  };
  category: "attraction" | "dining" | "lodging" | "transit" | "culture" | "nature";
}

export interface DayItinerary {
  dayNumber: number;
  date?: string;
  theme?: string;
  activities: ActivityItem[];
}

export interface TripPlan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetCategory: "budget" | "moderate" | "luxury";
  travelerCount: number;
  itinerary: DayItinerary[];
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherForecast {
  location: string;
  currentTemp: number;
  unit: string;
  condition: string;
  precipitationProbability: number;
  dailyForecast: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    condition: string;
  }>;
}

export interface RouteGeometry {
  coordinates: [number, number][]; // [longitude, latitude] pairs for Leaflet / GeoJSON
  distanceMeters: number;
  durationSeconds: number;
}
