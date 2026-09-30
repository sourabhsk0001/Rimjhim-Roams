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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
