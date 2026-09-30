export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string;
          destination_coords: unknown | null; // PostGIS geography(Point, 4326)
          start_date: string;
          end_date: string;
          budget_category: string;
          traveler_count: number;
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          destination: string;
          destination_coords?: unknown | null;
          start_date: string;
          end_date: string;
          budget_category?: string;
          traveler_count?: number;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          destination?: string;
          destination_coords?: unknown | null;
          start_date?: string;
          end_date?: string;
          budget_category?: string;
          traveler_count?: number;
          summary?: string | null;
          updated_at?: string;
        };
      };
      itinerary_items: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          title: string;
          description: string | null;
          location_name: string;
          location_coords: unknown | null; // PostGIS geography(Point, 4326)
          start_time: string | null;
          end_time: string | null;
          cost_amount: number | null;
          cost_currency: string | null;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_number: number;
          title: string;
          description?: string | null;
          location_name: string;
          location_coords?: unknown | null;
          start_time?: string | null;
          end_time?: string | null;
          cost_amount?: number | null;
          cost_currency?: string | null;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_number?: number;
          title?: string;
          description?: string | null;
          location_name?: string;
          location_coords?: unknown | null;
          start_time?: string | null;
          end_time?: string | null;
          cost_amount?: number | null;
          cost_currency?: string | null;
          category?: string;
        };
      };
      places: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          category: string | null;
          location: unknown; // PostGIS geography(Point, 4326)
          embedding: number[] | null; // pgvector (768 or 1536 dim)
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          category?: string | null;
          location: unknown;
          embedding?: number[] | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          category?: string | null;
          location?: unknown;
          embedding?: number[] | null;
          metadata?: Json | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_places: {
        Args: {
          query_embedding: number[];
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          name: string;
          category: string;
          similarity: number;
        }[];
      };
    };
  };
}
