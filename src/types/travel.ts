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

// ==============================================================================
// Phase 2: Core Travel Domain Entities
// ==============================================================================

export interface Destination {
  id: string;
  name: string;
  state_province: string;
  country: string;
  description: string;
  latitude: number;
  longitude: number;
  climate: string;
  best_time_to_visit: string;
  hero_image?: string;
  source: string;
  data_status: "DEMO" | "LIVE";
  created_at?: string;
  updated_at?: string;
}

export interface Attraction {
  id: string;
  destination_id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  opening_time: string;
  closing_time: string;
  ticket_price: number;
  currency: string;
  minimum_visit_minutes: number;
  recommended_visit_minutes: number;
  maximum_visit_minutes: number;
  best_visit_start: string;
  best_visit_end: string;
  peak_start: string;
  peak_end: string;
  estimated_queue_minutes: number;
  weather_suitability: string;
  source: string;
  data_status: "DEMO" | "LIVE";
  created_at?: string;
}

export interface Hotel {
  id: string;
  destination_id: string;
  name: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  currency: string;
  rating: number;
  amenities: string[];
  source: string;
  data_status: "DEMO" | "LIVE";
  created_at?: string;
}

export interface Restaurant {
  id: string;
  destination_id: string;
  name: string;
  latitude: number;
  longitude: number;
  cuisine: string;
  price_level: "$" | "$$" | "$$$" | "$$$$";
  estimated_price_per_person: number;
  dietary_options: string[];
  source: string;
  data_status: "DEMO" | "LIVE";
  created_at?: string;
}

export interface TransportOption {
  id: string;
  destination_id: string;
  origin: string;
  destination: string;
  mode: "flight" | "train" | "bus" | "ferry";
  provider: string;
  departure: string;
  arrival: string;
  duration_minutes: number;
  price: number;
  currency: string;
  transfers: number;
  source: string;
  data_status: "DEMO" | "LIVE";
  created_at?: string;
}

export interface TaxiOption {
  id: string;
  destination_id: string;
  name: string;
  vehicle_type: string;
  base_fare: number;
  price_per_km: number;
  currency: string;
  source: string;
  data_status: "DEMO" | "LIVE";
  created_at?: string;
}

export interface Review {
  id: string;
  entity_type: "destination" | "attraction" | "hotel" | "restaurant";
  entity_id: string;
  user_id?: string | null;
  author_name: string;
  rating: number;
  comment: string;
  source: string;
  created_at?: string;
}

export interface NearbyLocationResult {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  ticket_price?: number;
  distance_km: number;
  data_status: string;
}
