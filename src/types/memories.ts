/**
 * Type definitions for TripWise Travel Memories
 * Stores useful, non-sensitive personal travel preferences (Likes and Avoids).
 */

export type MemoryType = "like" | "avoid";

export type MemoryCategory =
  | "destination"
  | "hotel"
  | "restaurant"
  | "transit"
  | "itinerary"
  | "general";

export interface TravelMemory {
  id: string;
  user_id: string;
  type: MemoryType;
  category: MemoryCategory;
  keyword: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryInput {
  type: MemoryType;
  category: MemoryCategory;
  keyword: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateMemoryInput {
  type?: MemoryType;
  category?: MemoryCategory;
  keyword?: string;
  notes?: string;
  is_active?: boolean;
}

export interface UserTravelMemoriesSummary {
  userId: string;
  totalMemories: number;
  likes: string[];
  avoids: string[];
  destinationLikes: string[];
  destinationAvoids: string[];
  hotelLikes: string[];
  hotelAvoids: string[];
  restaurantLikes: string[];
  restaurantAvoids: string[];
  transitLikes: string[];
  transitAvoids: string[];
  itineraryLikes: string[];
  itineraryAvoids: string[];
  byCategory: {
    destination: { likes: string[]; avoids: string[] };
    hotel: { likes: string[]; avoids: string[] };
    restaurant: { likes: string[]; avoids: string[] };
    transit: { likes: string[]; avoids: string[] };
    itinerary: { likes: string[]; avoids: string[] };
    general: { likes: string[]; avoids: string[] };
  };
}

export interface MemoriesResponse {
  memories: TravelMemory[];
  summary: UserTravelMemoriesSummary;
}
