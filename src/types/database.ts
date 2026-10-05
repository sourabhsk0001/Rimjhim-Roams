export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TravellerType = "solo" | "couple" | "family" | "friends" | "business";
export type TravelPace = "relaxed" | "moderate" | "fast-paced";
export type BudgetTier = "budget" | "moderate" | "luxury";
export type TripStatus = "planning" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type MemberRole = "owner" | "editor" | "viewer";

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
      traveller_profiles: {
        Row: {
          id: string;
          user_id: string;
          nationality: string | null;
          phone_number: string | null;
          bio: string | null;
          emergency_contact: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nationality?: string | null;
          phone_number?: string | null;
          bio?: string | null;
          emergency_contact?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nationality?: string | null;
          phone_number?: string | null;
          bio?: string | null;
          emergency_contact?: Json | null;
          updated_at?: string;
        };
      };
      travel_preferences: {
        Row: {
          id: string;
          user_id: string;
          preferred_pace: TravelPace;
          budget_tier: BudgetTier;
          dietary_restrictions: string[];
          interests: string[];
          preferred_accommodation: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          preferred_pace?: TravelPace;
          budget_tier?: BudgetTier;
          dietary_restrictions?: string[];
          interests?: string[];
          preferred_accommodation?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          preferred_pace?: TravelPace;
          budget_tier?: BudgetTier;
          dietary_restrictions?: string[];
          interests?: string[];
          preferred_accommodation?: string;
          updated_at?: string;
        };
      };
      public_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          username: string;
          display_name: string;
          bio: string | null;
          avatar_url: string | null;
          home_city: string | null;
          travel_style: string;
          visited_states_count: number;
          badges: string[];
          top_destinations: string[];
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          username: string;
          display_name: string;
          bio?: string | null;
          avatar_url?: string | null;
          home_city?: string | null;
          travel_style?: string;
          visited_states_count?: number;
          badges?: string[];
          top_destinations?: string[];
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          username?: string;
          display_name?: string;
          bio?: string | null;
          avatar_url?: string | null;
          home_city?: string | null;
          travel_style?: string;
          visited_states_count?: number;
          badges?: string[];
          top_destinations?: string[];
          is_public?: boolean;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          origin: string;
          destination: string;
          start_date: string;
          end_date: string;
          duration_days: number;
          budget: number;
          currency: string;
          traveller_count: number;
          traveller_type: TravellerType;
          travel_pace: TravelPace;
          preferences: Json;
          status: TripStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          origin: string;
          destination?: string;
          start_date: string;
          end_date: string;
          duration_days: number;
          budget: number;
          currency?: string;
          traveller_count?: number;
          traveller_type?: TravellerType;
          travel_pace?: TravelPace;
          preferences?: Json;
          status?: TripStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          origin?: string;
          destination?: string;
          start_date?: string;
          end_date?: string;
          duration_days?: number;
          budget?: number;
          currency?: string;
          traveller_count?: number;
          traveller_type?: TravellerType;
          travel_pace?: TravelPace;
          preferences?: Json;
          status?: TripStatus;
          updated_at?: string;
        };
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: MemberRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role?: MemberRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          user_id?: string;
          role?: MemberRole;
        };
      };
      destinations: {
        Row: {
          id: string;
          name: string;
          state_province: string;
          country: string;
          description: string;
          latitude: number;
          longitude: number;
          climate: string;
          best_time_to_visit: string;
          hero_image: string | null;
          source: string;
          data_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          state_province: string;
          country?: string;
          description: string;
          latitude: number;
          longitude: number;
          climate?: string;
          best_time_to_visit: string;
          hero_image?: string | null;
          source?: string;
          data_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          state_province?: string;
          country?: string;
          description?: string;
          latitude?: number;
          longitude?: number;
          climate?: string;
          best_time_to_visit?: string;
          hero_image?: string | null;
          source?: string;
          data_status?: string;
          updated_at?: string;
        };
      };
      attractions: {
        Row: {
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
          data_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          name: string;
          description: string;
          category: string;
          latitude: number;
          longitude: number;
          opening_time: string;
          closing_time: string;
          ticket_price?: number;
          currency?: string;
          minimum_visit_minutes?: number;
          recommended_visit_minutes?: number;
          maximum_visit_minutes?: number;
          best_visit_start: string;
          best_visit_end: string;
          peak_start: string;
          peak_end: string;
          estimated_queue_minutes?: number;
          weather_suitability: string;
          source?: string;
          data_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          name?: string;
          description?: string;
          category?: string;
          latitude?: number;
          longitude?: number;
          opening_time?: string;
          closing_time?: string;
          ticket_price?: number;
          currency?: string;
          minimum_visit_minutes?: number;
          recommended_visit_minutes?: number;
          maximum_visit_minutes?: number;
          best_visit_start?: string;
          best_visit_end?: string;
          peak_start?: string;
          peak_end?: string;
          estimated_queue_minutes?: number;
          weather_suitability?: string;
          source?: string;
          data_status?: string;
          updated_at?: string;
        };
      };
      hotels: {
        Row: {
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
          data_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          name: string;
          latitude: number;
          longitude: number;
          price_per_night: number;
          currency?: string;
          rating?: number;
          amenities?: string[];
          source?: string;
          data_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          price_per_night?: number;
          currency?: string;
          rating?: number;
          amenities?: string[];
          source?: string;
          data_status?: string;
          updated_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          destination_id: string;
          name: string;
          latitude: number;
          longitude: number;
          cuisine: string;
          price_level: string;
          estimated_price_per_person: number;
          dietary_options: string[];
          source: string;
          data_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          name: string;
          latitude: number;
          longitude: number;
          cuisine: string;
          price_level: string;
          estimated_price_per_person: number;
          dietary_options?: string[];
          source?: string;
          data_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          name?: string;
          latitude?: number;
          longitude?: number;
          cuisine?: string;
          price_level?: string;
          estimated_price_per_person?: number;
          dietary_options?: string[];
          source?: string;
          data_status?: string;
          updated_at?: string;
        };
      };
      transport_options: {
        Row: {
          id: string;
          destination_id: string;
          origin: string;
          destination: string;
          mode: string;
          provider: string;
          departure: string;
          arrival: string;
          duration_minutes: number;
          price: number;
          currency: string;
          transfers: number;
          source: string;
          data_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          origin: string;
          destination: string;
          mode: string;
          provider: string;
          departure: string;
          arrival: string;
          duration_minutes: number;
          price: number;
          currency?: string;
          transfers?: number;
          source?: string;
          data_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          origin?: string;
          destination?: string;
          mode?: string;
          provider?: string;
          departure?: string;
          arrival?: string;
          duration_minutes?: number;
          price?: number;
          currency?: string;
          transfers?: number;
          source?: string;
          data_status?: string;
          updated_at?: string;
        };
      };
      taxi_options: {
        Row: {
          id: string;
          destination_id: string;
          name: string;
          vehicle_type: string;
          base_fare: number;
          price_per_km: number;
          currency: string;
          source: string;
          data_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          destination_id: string;
          name: string;
          vehicle_type: string;
          base_fare: number;
          price_per_km: number;
          currency?: string;
          source?: string;
          data_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          destination_id?: string;
          name?: string;
          vehicle_type?: string;
          base_fare?: number;
          price_per_km?: number;
          currency?: string;
          source?: string;
          data_status?: string;
          updated_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          user_id: string | null;
          author_name: string;
          rating: number;
          comment: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          user_id?: string | null;
          author_name?: string;
          rating: number;
          comment: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          entity_id?: string;
          user_id?: string | null;
          author_name?: string;
          rating?: number;
          comment?: string;
          source?: string;
        };
      };
      price_snapshots: {
        Row: {
          id: string;
          trip_id: string;
          item_type: "hotel" | "attraction" | "transport" | "restaurant" | "local_transport";
          item_id: string;
          item_name: string;
          price_minor_units: number;
          currency: string;
          snapshot_date: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          item_type: "hotel" | "attraction" | "transport" | "restaurant" | "local_transport";
          item_id: string;
          item_name: string;
          price_minor_units: number;
          currency?: string;
          snapshot_date?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          item_type?: "hotel" | "attraction" | "transport" | "restaurant" | "local_transport";
          item_id?: string;
          item_name?: string;
          price_minor_units?: number;
          currency?: string;
          snapshot_date?: string;
          metadata?: Json;
        };
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string | null;
          paid_by: string | null;
          split_type: "equal" | "custom" | "percentage";
          category:
            | "transport"
            | "hotel"
            | "food"
            | "local_transport"
            | "activities"
            | "shopping"
            | "emergency_buffer"
            | "other";
          title: string;
          amount_minor_units: number;
          currency: string;
          paid_at: string;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id?: string | null;
          paid_by?: string | null;
          split_type?: "equal" | "custom" | "percentage";
          category:
            | "transport"
            | "hotel"
            | "food"
            | "local_transport"
            | "activities"
            | "shopping"
            | "emergency_buffer"
            | "other";
          title: string;
          amount_minor_units: number;
          currency?: string;
          paid_at?: string;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          user_id?: string | null;
          paid_by?: string | null;
          split_type?: "equal" | "custom" | "percentage";
          category?:
            | "transport"
            | "hotel"
            | "food"
            | "local_transport"
            | "activities"
            | "shopping"
            | "emergency_buffer"
            | "other";
          title?: string;
          amount_minor_units?: number;
          currency?: string;
          paid_at?: string;
          payment_method?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      itineraries: {
        Row: {
          id: string;
          trip_id: string;
          day_number: number;
          date: string;
          title: string | null;
          theme: string | null;
          day_start_time: string;
          day_end_time: string;
          status: "draft" | "published" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_number: number;
          date: string;
          title?: string | null;
          theme?: string | null;
          day_start_time?: string;
          day_end_time?: string;
          status?: "draft" | "published" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_number?: number;
          date?: string;
          title?: string | null;
          theme?: string | null;
          day_start_time?: string;
          day_end_time?: string;
          status?: "draft" | "published" | "completed";
          updated_at?: string;
        };
      };
      itinerary_items: {
        Row: {
          id: string;
          itinerary_id: string;
          trip_id: string;
          attraction_id: string | null;
          title: string;
          category: "sightseeing" | "food" | "travel" | "rest" | "activity" | "lodging";
          date: string;
          start_time: string;
          end_time: string;
          location: Json;
          visit_minutes: number;
          travel_minutes: number;
          waiting_minutes: number;
          buffer_minutes: number;
          estimated_cost: number;
          priority: "must_visit" | "high" | "medium" | "low";
          status: "scheduled" | "completed" | "skipped";
          duration_tier: "Quick" | "Normal" | "Relaxed";
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          trip_id: string;
          attraction_id?: string | null;
          title: string;
          category: "sightseeing" | "food" | "travel" | "rest" | "activity" | "lodging";
          date: string;
          start_time: string;
          end_time: string;
          location: Json;
          visit_minutes?: number;
          travel_minutes?: number;
          waiting_minutes?: number;
          buffer_minutes?: number;
          estimated_cost?: number;
          priority?: "must_visit" | "high" | "medium" | "low";
          status?: "scheduled" | "completed" | "skipped";
          duration_tier?: "Quick" | "Normal" | "Relaxed";
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          trip_id?: string;
          attraction_id?: string | null;
          title?: string;
          category?: "sightseeing" | "food" | "travel" | "rest" | "activity" | "lodging";
          date?: string;
          start_time?: string;
          end_time?: string;
          location?: Json;
          visit_minutes?: number;
          travel_minutes?: number;
          waiting_minutes?: number;
          buffer_minutes?: number;
          estimated_cost?: number;
          priority?: "must_visit" | "high" | "medium" | "low";
          status?: "scheduled" | "completed" | "skipped";
          duration_tier?: "Quick" | "Normal" | "Relaxed";
          sort_order?: number;
          updated_at?: string;
        };
      };
      route_segments: {
        Row: {
          id: string;
          itinerary_id: string;
          from_item_id: string | null;
          to_item_id: string | null;
          mode: "driving" | "walking" | "cycling" | "transit";
          distance_meters: number;
          duration_seconds: number;
          polyline: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          itinerary_id: string;
          from_item_id?: string | null;
          to_item_id?: string | null;
          mode?: "driving" | "walking" | "cycling" | "transit";
          distance_meters?: number;
          duration_seconds?: number;
          polyline?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          itinerary_id?: string;
          from_item_id?: string | null;
          to_item_id?: string | null;
          mode?: "driving" | "walking" | "cycling" | "transit";
          distance_meters?: number;
          duration_seconds?: number;
          polyline?: Json | null;
        };
      };
      knowledge_documents: {
        Row: {
          id: string;
          title: string;
          content: string;
          source: string;
          destination: string;
          category: string;
          published_at: string;
          updated_at: string;
          retrieved_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          source: string;
          destination?: string;
          category?: string;
          published_at?: string;
          updated_at?: string;
          retrieved_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          source?: string;
          destination?: string;
          category?: string;
          published_at?: string;
          updated_at?: string;
          retrieved_at?: string | null;
          metadata?: Json;
        };
      };
      knowledge_chunks: {
        Row: {
          id: string;
          document_id: string;
          chunk_index: number;
          title: string;
          content: string;
          source: string;
          destination: string;
          category: string;
          token_count: number;
          embedding: string | number[];
          metadata: Json;
          retrieved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          chunk_index: number;
          title: string;
          content: string;
          source: string;
          destination?: string;
          category?: string;
          token_count?: number;
          embedding: string | number[];
          metadata?: Json;
          retrieved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          chunk_index?: number;
          title?: string;
          content?: string;
          source?: string;
          destination?: string;
          category?: string;
          token_count?: number;
          embedding?: string | number[];
          metadata?: Json;
          retrieved_at?: string | null;
          updated_at?: string;
        };
      };
      trip_invitations: {
        Row: {
          id: string;
          trip_id: string;
          inviter_id: string;
          invitee_email: string;
          invitee_user_id: string | null;
          role: MemberRole;
          status: "pending" | "accepted" | "declined" | "cancelled";
          token: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          inviter_id: string;
          invitee_email: string;
          invitee_user_id?: string | null;
          role?: MemberRole;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          token: string;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          inviter_id?: string;
          invitee_email?: string;
          invitee_user_id?: string | null;
          role?: MemberRole;
          status?: "pending" | "accepted" | "declined" | "cancelled";
          token?: string;
          expires_at?: string;
          updated_at?: string;
        };
      };
      group_polls: {
        Row: {
          id: string;
          trip_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          options: Json;
          status: "active" | "closed";
          deadline: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          creator_id: string;
          title: string;
          description?: string | null;
          options?: Json;
          status?: "active" | "closed";
          deadline?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          options?: Json;
          status?: "active" | "closed";
          deadline?: string | null;
          updated_at?: string;
        };
      };
      group_votes: {
        Row: {
          id: string;
          poll_id: string;
          trip_id: string;
          user_id: string;
          option_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          trip_id: string;
          user_id: string;
          option_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          trip_id?: string;
          user_id?: string;
          option_id?: string;
        };
      };
      expense_participants: {
        Row: {
          id: string;
          expense_id: string;
          trip_id: string;
          user_id: string;
          share_amount_minor_units: number;
          share_percentage: number | null;
          has_settled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          trip_id: string;
          user_id: string;
          share_amount_minor_units: number;
          share_percentage?: number | null;
          has_settled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          trip_id?: string;
          user_id?: string;
          share_amount_minor_units?: number;
          share_percentage?: number | null;
          has_settled?: boolean;
        };
      };
      travel_memories: {
        Row: {
          id: string;
          user_id: string;
          type: "like" | "avoid";
          category: "destination" | "hotel" | "restaurant" | "transit" | "itinerary" | "general";
          keyword: string;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "like" | "avoid";
          category: "destination" | "hotel" | "restaurant" | "transit" | "itinerary" | "general";
          keyword: string;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "like" | "avoid";
          category?: "destination" | "hotel" | "restaurant" | "transit" | "itinerary" | "general";
          keyword?: string;
          notes?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_nearby_attractions: {
        Args: {
          target_lat: number;
          target_lng: number;
          radius_km?: number;
        };
        Returns: {
          id: string;
          destination_id: string;
          name: string;
          category: string;
          latitude: number;
          longitude: number;
          ticket_price: number;
          distance_km: number;
          data_status: string;
        }[];
      };
      match_knowledge_chunks: {
        Args: {
          query_embedding: number[];
          match_threshold?: number;
          match_count?: number;
          filter_destination?: string | null;
          filter_category?: string | null;
        };
        Returns: {
          id: string;
          document_id: string;
          chunk_index: number;
          title: string;
          content: string;
          source: string;
          destination: string;
          category: string;
          token_count: number;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
  };
}
