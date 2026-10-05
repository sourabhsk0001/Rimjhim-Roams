/**
 * Recommendations & NATMO/GeoNames Autocomplete Types
 */

import { IndiaTourismLocation, IndiaZone, TourismCategory } from './india-tourism';
import { BudgetTier, TravelPace, TravellerType } from './database';

export type NATMOTourismTheme =
  | 'Spiritual & Pilgrimage'
  | 'Royal Forts & Palaces'
  | 'Coastal Beaches & Marine'
  | 'Wildlife & Tiger Reserves'
  | 'Himalayan Valleys & Monasteries'
  | 'Tea Gardens & Hill Stations'
  | 'Waterfalls & Eco-Tourism'
  | 'Ancient Caves & Rock Architecture'
  | 'Cultural Heritage & Food Corridors'
  | 'Desert Safari & Dunes';

export interface UserPreferenceProfile {
  user_id: string;
  onboarding_completed: boolean;
  primary_themes: NATMOTourismTheme[];
  preferred_zones: IndiaZone[];
  preferred_pace: TravelPace;
  budget_tier: BudgetTier;
  companion_type: TravellerType;
  preferred_states?: string[];
  implicit_interests: Record<string, number>; // Category weights (e.g. { fort: 5, temple: 8 })
  implicit_states: Record<string, number>; // State visit frequency
  implicit_tags: Record<string, number>; // Specific tag affinities
  total_itineraries_analyzed: number;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RecommendationOption {
  location: IndiaTourismLocation;
  matchScore: number; // 0 - 100
  matchPercentage: number;
  matchReasons: string[];
  seasonalSuitability: 'peak' | 'good' | 'moderate';
  thematicCircuit?: string;
  natmoTheme?: string;
}

export interface PersonalizedRecommendationsResult {
  userId: string;
  onboardingCompleted: boolean;
  userSummary: {
    preferredPace: TravelPace;
    budgetTier: BudgetTier;
    topThemes: string[];
    topImplicitCategories: string[];
    topVisitedStates: string[];
  };
  recommendations: RecommendationOption[];
  circuitRecommendations: Array<{
    circuitName: string;
    theme: string;
    states: string[];
    locations: IndiaTourismLocation[];
    description: string;
    matchScore: number;
  }>;
  totalRecommendations: number;
  generatedAt: string;
}

export interface AutocompleteSuggestion {
  id: string;
  title: string;
  subtitle: string;
  type: 'state' | 'district' | 'city' | 'natmo_circuit' | 'attraction';
  category?: string;
  state?: string;
  district?: string;
  natmoTheme?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  badge: string;
  score: number;
}

export interface NATMOCircuitDefinition {
  id: string;
  name: string;
  theme: NATMOTourismTheme;
  zone: IndiaZone;
  primaryStates: string[];
  keyDestinations: string[];
  description: string;
  bestMonths: string;
}
