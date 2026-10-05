/**
 * Personalized Travel Recommendation Engine
 * Combines:
 * 1. Explicit preferences collected from Onboarding Form
 * 2. Implicit preferences learned dynamically from saved itineraries & trips
 * 3. NATMO Thematic Circuits & MoT/GeoNames Knowledge Base
 * 4. Multi-factor scoring with seasonality and explainable rationale
 */

import { ALL_STATES_AND_UTS, INDIA_TOURISM_LOCATIONS } from '@/lib/data/india-tourism-kb';
import { NATMO_THEMATIC_CIRCUITS } from './tourism-autocomplete-service';
import { getUserTrips } from './trip-service';
import { getTripItineraries } from './itinerary-service';
import {
  UserPreferenceProfile,
  RecommendationOption,
  PersonalizedRecommendationsResult,
  NATMOTourismTheme,
} from '@/types/recommendations';
import { IndiaTourismLocation, IndiaZone } from '@/types/india-tourism';
import { TravelPace, BudgetTier, TravellerType } from '@/types/database';

// In-memory preference profiles store for local / demo runtime
const memoryUserPreferences: Map<string, UserPreferenceProfile> =
  (globalThis as unknown as { __memoryUserPreferences?: Map<string, UserPreferenceProfile> })
    .__memoryUserPreferences || new Map<string, UserPreferenceProfile>();
(globalThis as unknown as { __memoryUserPreferences?: Map<string, UserPreferenceProfile> })
  .__memoryUserPreferences = memoryUserPreferences;

// Mapping NATMO themes to relevant tourism categories and tags
const THEME_TO_CATEGORY_MAP: Record<NATMOTourismTheme, string[]> = {
  'Spiritual & Pilgrimage': ['temple', 'pilgrimage_site', 'spiritual', 'jyotirlinga', 'ghats'],
  'Royal Forts & Palaces': ['fort', 'heritage_palace', 'historical_monument', 'royal', 'unesco'],
  'Coastal Beaches & Marine': ['beach', 'coastal', 'islands', 'backwaters', 'sea'],
  'Wildlife & Tiger Reserves': ['national_park', 'wildlife_sanctuary', 'safari', 'tigers', 'rhino'],
  'Himalayan Valleys & Monasteries': ['viewpoint', 'natural_attraction', 'monastery', 'himalayan', 'pass'],
  'Tea Gardens & Hill Stations': ['hill_station', 'tea_plantations', 'lake', 'scenic', 'valley'],
  'Waterfalls & Eco-Tourism': ['waterfall', 'natural_attraction', 'cave', 'eco_tourism', 'forest'],
  'Ancient Caves & Rock Architecture': ['cave', 'historical_monument', 'rock_cut', 'unesco'],
  'Cultural Heritage & Food Corridors': ['cultural_hub', 'museum', 'monument', 'handicrafts'],
  'Desert Safari & Dunes': ['fort', 'desert', 'sand_dunes', 'camel_safari'],
};

export class RecommendationEngineService {
  /**
   * Retrieves user preference profile or initializes default profile
   */
  public getUserPreferences(userId: string): UserPreferenceProfile {
    const existing = memoryUserPreferences.get(userId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const initialProfile: UserPreferenceProfile = {
      user_id: userId,
      onboarding_completed: false,
      primary_themes: [
        'Royal Forts & Palaces',
        'Coastal Beaches & Marine',
        'Spiritual & Pilgrimage',
      ],
      preferred_zones: ['North', 'West', 'South'],
      preferred_pace: 'moderate',
      budget_tier: 'moderate',
      companion_type: 'couple',
      preferred_states: ['Rajasthan', 'Goa', 'Kerala'],
      implicit_interests: {},
      implicit_states: {},
      implicit_tags: {},
      total_itineraries_analyzed: 0,
      created_at: now,
      updated_at: now,
    };

    memoryUserPreferences.set(userId, initialProfile);
    return initialProfile;
  }

  /**
   * Saves onboarding questionnaire preferences
   */
  public saveOnboardingPreferences(
    userId: string,
    preferences: {
      primary_themes?: NATMOTourismTheme[];
      preferred_zones?: IndiaZone[];
      preferred_pace?: TravelPace;
      budget_tier?: BudgetTier;
      companion_type?: TravellerType;
      preferred_states?: string[];
    }
  ): UserPreferenceProfile {
    const profile = this.getUserPreferences(userId);
    const now = new Date().toISOString();

    if (preferences.primary_themes) {
      profile.primary_themes = preferences.primary_themes;
    }
    if (preferences.preferred_zones) {
      profile.preferred_zones = preferences.preferred_zones;
    }
    if (preferences.preferred_pace) {
      profile.preferred_pace = preferences.preferred_pace;
    }
    if (preferences.budget_tier) {
      profile.budget_tier = preferences.budget_tier;
    }
    if (preferences.companion_type) {
      profile.companion_type = preferences.companion_type;
    }
    if (preferences.preferred_states) {
      profile.preferred_states = preferences.preferred_states;
    }

    profile.onboarding_completed = true;
    profile.updated_at = now;

    // Seed initial implicit interest boosts from chosen themes
    for (const theme of profile.primary_themes) {
      const relatedKeywords = THEME_TO_CATEGORY_MAP[theme] || [];
      for (const kw of relatedKeywords) {
        profile.implicit_interests[kw] = (profile.implicit_interests[kw] || 0) + 3;
      }
    }

    memoryUserPreferences.set(userId, profile);
    return profile;
  }

  /**
   * Dynamically analyzes user's saved trips and itineraries to extract implicit preferences
   */
  public async syncPreferencesFromSavedItineraries(userId: string): Promise<{
    success: boolean;
    tripsAnalyzed: number;
    itinerariesAnalyzed: number;
    topLearnedCategories: string[];
    topVisitedStates: string[];
    updatedProfile: UserPreferenceProfile;
  }> {
    const profile = this.getUserPreferences(userId);
    const { upcoming, previous } = await getUserTrips(userId);
    const allTrips = [...upcoming, ...previous];

    let itinerariesCount = 0;

    for (const trip of allTrips) {
      // Analyze trip destination & state
      const destClean = trip.destination.toLowerCase();
      // Match destination against states or cities
      const stateMatch = ALL_STATES_AND_UTS.find(
        (s) =>
          s.name.toLowerCase().includes(destClean) ||
          destClean.includes(s.name.toLowerCase()) ||
          s.top_destinations.some((d) => d.toLowerCase().includes(destClean))
      );
      if (stateMatch) {
        profile.implicit_states[stateMatch.name] =
          (profile.implicit_states[stateMatch.name] || 0) + 3;
      }

      // Load itinerary days and analyze items
      const itinRes = await getTripItineraries(trip.id, userId);
      if (itinRes.success && itinRes.days) {
        itinerariesCount += itinRes.days.length;

        for (const day of itinRes.days) {
          for (const item of day.items) {
            const titleLower = item.title.toLowerCase();
            const locationLower = (item.location?.name || '').toLowerCase() + ' ' + (item.location?.address || '').toLowerCase();
            const categoryLower = item.category.toLowerCase();

            // Match against known tourism categories
            profile.implicit_interests[categoryLower] =
              (profile.implicit_interests[categoryLower] || 0) + 1;

            // Inspect matched POI tags
            for (const loc of INDIA_TOURISM_LOCATIONS) {
              if (
                titleLower.includes(loc.name.toLowerCase()) ||
                loc.name.toLowerCase().includes(titleLower) ||
                locationLower.includes(loc.name.toLowerCase()) ||
                loc.aliases.some((a) => titleLower.includes(a.toLowerCase()))
              ) {
                profile.implicit_interests[loc.category] =
                  (profile.implicit_interests[loc.category] || 0) + 2;
                profile.implicit_states[loc.state] =
                  (profile.implicit_states[loc.state] || 0) + 2;

                for (const tag of loc.tourism_tags) {
                  profile.implicit_tags[tag] = (profile.implicit_tags[tag] || 0) + 1;
                }
              }
            }

            // Keyword based learning
            if (titleLower.includes('fort') || locationLower.includes('fort')) {
              profile.implicit_interests['fort'] = (profile.implicit_interests['fort'] || 0) + 2;
            }
            if (titleLower.includes('temple') || titleLower.includes('shrine') || locationLower.includes('temple')) {
              profile.implicit_interests['temple'] = (profile.implicit_interests['temple'] || 0) + 2;
            }
            if (titleLower.includes('beach') || locationLower.includes('coast')) {
              profile.implicit_interests['beach'] = (profile.implicit_interests['beach'] || 0) + 2;
            }
            if (titleLower.includes('palace') || locationLower.includes('palace')) {
              profile.implicit_interests['heritage_palace'] =
                (profile.implicit_interests['heritage_palace'] || 0) + 2;
            }
            if (titleLower.includes('safari') || locationLower.includes('tiger')) {
              profile.implicit_interests['national_park'] =
                (profile.implicit_interests['national_park'] || 0) + 2;
            }
          }
        }
      }
    }

    profile.total_itineraries_analyzed = itinerariesCount;
    profile.last_synced_at = new Date().toISOString();
    profile.updated_at = new Date().toISOString();

    memoryUserPreferences.set(userId, profile);

    // Compute top learned categories and states
    const topCategories = Object.entries(profile.implicit_interests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    const topStates = Object.entries(profile.implicit_states)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k);

    return {
      success: true,
      tripsAnalyzed: allTrips.length,
      itinerariesAnalyzed: itinerariesCount,
      topLearnedCategories: topCategories,
      topVisitedStates: topStates,
      updatedProfile: profile,
    };
  }

  /**
   * Generates scored, personalized travel recommendations and circuit itineraries
   */
  public generatePersonalizedRecommendations(
    userId: string,
    options: { limit?: number; seasonMonth?: number } = {}
  ): PersonalizedRecommendationsResult {
    const profile = this.getUserPreferences(userId);
    const limit = options.limit || 9;
    const currentMonth = options.seasonMonth || new Date().getMonth() + 1; // 1 to 12

    const scoredOptions: RecommendationOption[] = [];

    for (const loc of INDIA_TOURISM_LOCATIONS) {
      const matchReasons: string[] = [];
      let totalScore = 0;

      // ------------------------------------------------------------------------
      // Factor 1: NATMO Theme Match (35 Points Max)
      // ------------------------------------------------------------------------
      let themeScore = 0;
      let matchedThemeName: string | undefined;

      for (const theme of profile.primary_themes) {
        const keywords = THEME_TO_CATEGORY_MAP[theme] || [];
        const hasKeywordMatch =
          keywords.includes(loc.category) ||
          keywords.some((kw) => loc.tourism_tags.some((t) => t.includes(kw))) ||
          keywords.some((kw) => loc.description.toLowerCase().includes(kw));

        if (hasKeywordMatch) {
          themeScore = Math.max(themeScore, 35);
          matchedThemeName = theme;
          break;
        }
      }

      if (themeScore > 0 && matchedThemeName) {
        totalScore += themeScore;
        matchReasons.push(`Matches your passion for ${matchedThemeName}`);
      } else {
        // Partial theme points if tag overlaps
        const implicitTagPoints = loc.tourism_tags.reduce((acc, tag) => {
          return acc + (profile.implicit_tags[tag] ? 3 : 0);
        }, 0);
        if (implicitTagPoints > 0) {
          const clamped = Math.min(implicitTagPoints, 20);
          totalScore += clamped;
          matchReasons.push(`Shares tags with your previously saved sights`);
        }
      }

      // ------------------------------------------------------------------------
      // Factor 2: Category Affinity from Saved Itineraries (25 Points Max)
      // ------------------------------------------------------------------------
      const categoryWeight = profile.implicit_interests[loc.category] || 0;
      if (categoryWeight > 0) {
        const catPoints = Math.min(categoryWeight * 4, 25);
        totalScore += catPoints;
        matchReasons.push(
          `Frequently planned activity: ${loc.category.replace('_', ' ')}`
        );
      }

      // ------------------------------------------------------------------------
      // Factor 3: Geographic Zone & State Affinity (20 Points Max)
      // ------------------------------------------------------------------------
      const stateObj = ALL_STATES_AND_UTS.find((s) => s.name === loc.state);
      const locZone = stateObj?.zone || 'North';

      if (profile.preferred_zones.includes(locZone)) {
        totalScore += 12;
        matchReasons.push(`Located in your preferred ${locZone} India zone`);
      }

      if (
        profile.preferred_states &&
        profile.preferred_states.some(
          (s) => s.toLowerCase() === loc.state.toLowerCase()
        )
      ) {
        totalScore += 8;
        matchReasons.push(`Set in ${loc.state}, one of your target states`);
      } else if (profile.implicit_states[loc.state]) {
        totalScore += 5;
        matchReasons.push(`Expands your itinerary in ${loc.state}`);
      }

      // ------------------------------------------------------------------------
      // Factor 4: Seasonality Suitability (10 Points Max)
      // ------------------------------------------------------------------------
      let seasonalSuitability: 'peak' | 'good' | 'moderate' = 'good';
      // October (10) to March (3): Ideal for Rajasthan, Goa, South, Varanasi
      const isWinterWindow = currentMonth >= 10 || currentMonth <= 3;
      const isHimalayanWindow = currentMonth >= 4 && currentMonth <= 6;
      const isMonsoonWindow = currentMonth >= 7 && currentMonth <= 9;

      if (
        isWinterWindow &&
        ['Rajasthan', 'Goa', 'Kerala', 'Tamil Nadu', 'Uttar Pradesh'].includes(loc.state)
      ) {
        totalScore += 10;
        seasonalSuitability = 'peak';
        matchReasons.push(`Peak visiting season right now (${loc.operational.best_time_to_visit})`);
      } else if (
        isHimalayanWindow &&
        ['Himachal Pradesh', 'Uttarakhand', 'Jammu and Kashmir', 'Ladakh', 'Sikkim'].includes(
          loc.state
        )
      ) {
        totalScore += 10;
        seasonalSuitability = 'peak';
        matchReasons.push(`Optimal summer weather (${loc.operational.best_time_to_visit})`);
      } else if (
        isMonsoonWindow &&
        ['Kerala', 'Meghalaya', 'Goa'].includes(loc.state) &&
        loc.category === 'waterfall'
      ) {
        totalScore += 10;
        seasonalSuitability = 'peak';
        matchReasons.push(`Spectacular monsoon waterfall flow`);
      } else {
        totalScore += 5;
        seasonalSuitability = 'good';
      }

      // ------------------------------------------------------------------------
      // Factor 5: Quality & UNESCO Recognition (10 Points Max)
      // ------------------------------------------------------------------------
      if (loc.sources.details?.unesco_recognized) {
        totalScore += 6;
        matchReasons.push(`UNESCO World Heritage Site`);
      }
      if (loc.sources.mot) {
        totalScore += 4;
      }

      // Scale final score to 0 - 100
      const finalScore = Math.min(Math.round(totalScore), 100);

      scoredOptions.push({
        location: loc,
        matchScore: finalScore,
        matchPercentage: finalScore,
        matchReasons: matchReasons.slice(0, 3),
        seasonalSuitability,
        thematicCircuit: loc.sources.details?.mot_circuit,
        natmoTheme: matchedThemeName,
      });
    }

    // Sort by highest match score
    scoredOptions.sort((a, b) => b.matchScore - a.matchScore);

    // Filter top circuit recommendations aligned with user's primary themes
    const circuitRecommendations = NATMO_THEMATIC_CIRCUITS.filter(
      (c) =>
        profile.primary_themes.includes(c.theme) ||
        profile.preferred_zones.includes(c.zone)
    )
      .slice(0, 3)
      .map((circuit) => {
        const circuitLocs = INDIA_TOURISM_LOCATIONS.filter((l) =>
          circuit.primaryStates.includes(l.state)
        ).slice(0, 4);

        return {
          circuitName: circuit.name,
          theme: circuit.theme,
          states: circuit.primaryStates,
          locations: circuitLocs,
          description: circuit.description,
          matchScore: 92,
        };
      });

    return {
      userId,
      onboardingCompleted: profile.onboarding_completed,
      userSummary: {
        preferredPace: profile.preferred_pace,
        budgetTier: profile.budget_tier,
        topThemes: profile.primary_themes,
        topImplicitCategories: Object.entries(profile.implicit_interests)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([k]) => k),
        topVisitedStates: Object.entries(profile.implicit_states)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([k]) => k),
      },
      recommendations: scoredOptions.slice(0, limit),
      circuitRecommendations,
      totalRecommendations: scoredOptions.length,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const recommendationEngineService = new RecommendationEngineService();
