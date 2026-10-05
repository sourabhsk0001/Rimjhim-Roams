/**
 * India Tourism Knowledge Base Service
 * Synthesizes official MoT, NATMO, OpenStreetMap, and GeoNames data.
 * Provides deduplication, multi-source conflict resolution, spatial search,
 * and AI itinerary generation capabilities.
 */

import {
  IndiaTourismLocation,
  IndiaTourismSearchFilter,
  StateUTSummary,
  TourismCategory,
  IndiaZone,
} from '@/types/india-tourism';
import { ALL_STATES_AND_UTS, INDIA_TOURISM_LOCATIONS } from '@/lib/data/india-tourism-kb';

export interface LocationWithDistance extends IndiaTourismLocation {
  distanceKm: number;
}

export interface ItineraryDayPlan {
  day: number;
  theme: string;
  locations: IndiaTourismLocation[];
  estimatedHours: number;
  estimatedEntryFeeInr: number;
}

export interface AIItineraryRecommendation {
  stateOrRegion: string;
  totalDays: number;
  totalAttractions: number;
  totalEntryFeeInr: number;
  daysPlan: ItineraryDayPlan[];
  suggestedRoute: string[];
  travelTips: string[];
  sourceAttribution: {
    motVerifiedCount: number;
    osmGeoReferencedCount: number;
    natmoThematicCount: number;
    geonamesHierarchyCount: number;
  };
}

export class IndiaTourismService {
  private locations: IndiaTourismLocation[];
  private statesAndUTs: StateUTSummary[];

  constructor(
    initialLocations: IndiaTourismLocation[] = INDIA_TOURISM_LOCATIONS,
    initialStates: StateUTSummary[] = ALL_STATES_AND_UTS
  ) {
    this.locations = this.deduplicateLocations(initialLocations);
    this.statesAndUTs = initialStates;
  }

  /**
   * Returns all 28 States and 8 Union Territories with metadata
   */
  public getAllStatesAndUTs(): StateUTSummary[] {
    return this.statesAndUTs;
  }

  /**
   * Retrieves summary for a specific State or Union Territory
   */
  public getStateSummary(stateOrUTName: string): StateUTSummary | undefined {
    const normalized = stateOrUTName.trim().toLowerCase();
    return this.statesAndUTs.find(
      (s) => s.name.toLowerCase() === normalized || s.capital.toLowerCase() === normalized
    );
  }

  /**
   * Returns all locations in the knowledge base
   */
  public getAllLocations(): IndiaTourismLocation[] {
    return this.locations;
  }

  /**
   * Get location by canonical ID
   */
  public getLocationById(id: string): IndiaTourismLocation | undefined {
    return this.locations.find((loc) => loc.id === id);
  }

  /**
   * Multi-criteria search across name, aliases, description, tags, state, district, and category
   */
  public searchLocations(filter: IndiaTourismSearchFilter): {
    locations: IndiaTourismLocation[];
    total: number;
    stateSummary?: StateUTSummary;
  } {
    let result = [...this.locations];

    // Filter by State / UT
    if (filter.state && filter.state.trim() !== '') {
      const stateTerm = filter.state.trim().toLowerCase();
      result = result.filter((loc) => loc.state.toLowerCase().includes(stateTerm));
    }

    // Filter by District
    if (filter.district && filter.district.trim() !== '') {
      const districtTerm = filter.district.trim().toLowerCase();
      result = result.filter((loc) => loc.district.toLowerCase().includes(districtTerm));
    }

    // Filter by Category
    if (filter.category && filter.category.trim() !== '' && filter.category !== 'all') {
      const catTerm = filter.category.trim().toLowerCase();
      result = result.filter((loc) => loc.category.toLowerCase() === catTerm);
    }

    // Filter by Zone
    if (filter.zone) {
      const targetStatesInZone = new Set(
        this.statesAndUTs.filter((s) => s.zone === filter.zone).map((s) => s.name.toLowerCase())
      );
      result = result.filter((loc) => targetStatesInZone.has(loc.state.toLowerCase()));
    }

    // Filter by Tag
    if (filter.tag && filter.tag.trim() !== '') {
      const tagTerm = filter.tag.trim().toLowerCase();
      result = result.filter((loc) =>
        loc.tourism_tags.some((t) => t.toLowerCase().includes(tagTerm))
      );
    }

    // Filter by Max Entry Fee
    if (typeof filter.maxEntryFee === 'number') {
      result = result.filter((loc) => loc.operational.entry_fee_inr <= filter.maxEntryFee!);
    }

    // General keyword query
    if (filter.query && filter.query.trim() !== '') {
      const q = filter.query.trim().toLowerCase();
      result = result.filter((loc) => {
        return (
          loc.name.toLowerCase().includes(q) ||
          (loc.vernacular_name && loc.vernacular_name.toLowerCase().includes(q)) ||
          loc.aliases.some((a) => a.toLowerCase().includes(q)) ||
          loc.description.toLowerCase().includes(q) ||
          loc.city.toLowerCase().includes(q) ||
          loc.district.toLowerCase().includes(q) ||
          loc.state.toLowerCase().includes(q) ||
          loc.tourism_tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    const total = result.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    const paginated = result.slice(offset, offset + limit);

    let stateSummary: StateUTSummary | undefined;
    if (filter.state) {
      stateSummary = this.getStateSummary(filter.state);
    }

    return {
      locations: paginated,
      total,
      stateSummary,
    };
  }

  /**
   * Spatial search: Finds POIs within radiusKm using Haversine formula
   */
  public getNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit: number = 10,
    category?: string
  ): LocationWithDistance[] {
    const scored: LocationWithDistance[] = [];

    for (const loc of this.locations) {
      if (category && category !== 'all' && loc.category.toLowerCase() !== category.toLowerCase()) {
        continue;
      }

      const dist = this.haversineDistance(latitude, longitude, loc.latitude, loc.longitude);
      if (dist <= radiusKm) {
        scored.push({
          ...loc,
          distanceKm: Math.round(dist * 10) / 10,
        });
      }
    }

    scored.sort((a, b) => a.distanceKm - b.distanceKm);
    return scored.slice(0, limit);
  }

  /**
   * Deduplicates a list of locations and reconciles conflicting attributes
   * Multi-source conflict hierarchy: MoT > NATMO > OSM > GeoNames for descriptions & authority;
   * OSM for coordinates; GeoNames for administrative hierarchy.
   */
  public deduplicateLocations(locations: IndiaTourismLocation[]): IndiaTourismLocation[] {
    const dedupedMap = new Map<string, IndiaTourismLocation>();

    for (const item of locations) {
      // Create a normalized key
      const normalizedName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedState = item.state.toLowerCase().replace(/[^a-z0-9]/g, '');
      const compositeKey = `${normalizedName}_${normalizedState}`;

      if (!dedupedMap.has(item.id) && !dedupedMap.has(compositeKey)) {
        dedupedMap.set(item.id, { ...item });
        dedupedMap.set(compositeKey, dedupedMap.get(item.id)!);
      } else {
        // Resolve conflict & merge sources
        const existing = dedupedMap.get(item.id) || dedupedMap.get(compositeKey)!;

        // Merge sources flags
        existing.sources.mot = existing.sources.mot || item.sources.mot;
        existing.sources.natmo = existing.sources.natmo || item.sources.natmo;
        existing.sources.osm = existing.sources.osm || item.sources.osm;
        existing.sources.geonames = existing.sources.geonames || item.sources.geonames;

        // Merge details
        if (item.sources.details) {
          existing.sources.details = {
            ...existing.sources.details,
            ...item.sources.details,
          };
        }

        // Aliases merge
        const allAliases = new Set([...existing.aliases, ...item.aliases, item.name]);
        allAliases.delete(existing.name);
        existing.aliases = Array.from(allAliases);

        // Tags merge
        const allTags = new Set([...existing.tourism_tags, ...item.tourism_tags]);
        existing.tourism_tags = Array.from(allTags);

        // Nearby attractions merge
        const allNearby = new Set([...existing.nearby_attractions, ...item.nearby_attractions]);
        existing.nearby_attractions = Array.from(allNearby);

        // Conflict resolution for primary authority: MoT > NATMO > OSM > GeoNames
        const sourcePriority = {
          'Ministry of Tourism': 4,
          NATMO: 3,
          OpenStreetMap: 2,
          GeoNames: 1,
        };

        if (
          sourcePriority[item.sources.primary_source] >
          sourcePriority[existing.sources.primary_source]
        ) {
          existing.description = item.description;
          existing.category = item.category;
          existing.sources.primary_source = item.sources.primary_source;
        }

        // OSM coordinates priority if existing coords look unset or default
        if (item.sources.osm && (existing.latitude === 0 || isNaN(existing.latitude))) {
          existing.latitude = item.latitude;
          existing.longitude = item.longitude;
        }
      }
    }

    // Return unique locations array
    const seenIds = new Set<string>();
    const result: IndiaTourismLocation[] = [];
    for (const loc of Array.from(dedupedMap.values())) {
      if (!seenIds.has(loc.id)) {
        seenIds.add(loc.id);
        result.push(loc);
      }
    }

    return result;
  }

  /**
   * AI Travel-Planning Agent Engine:
   * Generates clustered, day-by-day itineraries with route suggestions,
   * budgeting, and multi-source attribution.
   */
  public recommendForItinerary(params: {
    state?: string;
    district?: string;
    category?: string;
    themes?: string[];
    maxDays?: number;
    maxBudgetInr?: number;
    startLocationId?: string;
  }): AIItineraryRecommendation {
    const days = Math.max(1, Math.min(params.maxDays || 3, 14));
    const targetState = params.state || 'Rajasthan';

    // Fetch candidate locations in target state/district
    let candidates = this.locations.filter(
      (loc) => loc.state.toLowerCase() === targetState.toLowerCase()
    );

    if (candidates.length === 0) {
      // Fallback to national highlights if state has no exact match
      candidates = this.locations;
    }

    if (params.district) {
      const distMatches = candidates.filter(
        (c) => c.district.toLowerCase() === params.district!.toLowerCase()
      );
      if (distMatches.length >= 2) {
        candidates = distMatches;
      }
    }

    if (params.category && params.category !== 'all') {
      const catMatches = candidates.filter(
        (c) => c.category.toLowerCase() === params.category!.toLowerCase()
      );
      if (catMatches.length >= 2) {
        candidates = catMatches;
      }
    }

    // Sort candidates: prioritize UNESCO & MoT verified, then by ideal hours
    candidates.sort((a, b) => {
      const aScore = (a.sources.mot ? 2 : 0) + (a.sources.details?.unesco_recognized ? 3 : 0);
      const bScore = (b.sources.mot ? 2 : 0) + (b.sources.details?.unesco_recognized ? 3 : 0);
      return bScore - aScore;
    });

    // Cluster into days (approx 2 attractions per day based on hours)
    const daysPlan: ItineraryDayPlan[] = [];
    const used = new Set<string>();
    const routeOrder: string[] = [];

    let totalEntryFee = 0;
    let poolIndex = 0;

    for (let d = 1; d <= days; d++) {
      const dayLocations: IndiaTourismLocation[] = [];
      let dayHours = 0;
      let dayFee = 0;

      while (dayLocations.length < 2 && poolIndex < candidates.length) {
        const candidate = candidates[poolIndex];
        poolIndex++;

        if (!used.has(candidate.id)) {
          used.add(candidate.id);
          dayLocations.push(candidate);
          dayHours += candidate.operational.ideal_duration_hours || 2;
          dayFee += candidate.operational.entry_fee_inr || 0;
          routeOrder.push(candidate.name);
        }
      }

      // If pool exhausted but day needs attractions, draw from candidates
      if (dayLocations.length === 0 && candidates.length > 0) {
        const fallback = candidates[(d - 1) % candidates.length];
        dayLocations.push(fallback);
        dayHours += fallback.operational.ideal_duration_hours || 2;
        dayFee += fallback.operational.entry_fee_inr || 0;
      }

      totalEntryFee += dayFee;

      const dayTheme =
        dayLocations.length > 0
          ? `${dayLocations[0].city} Highlights & ${dayLocations[0].category.replace('_', ' ')}`
          : `Cultural Discovery Day ${d}`;

      daysPlan.push({
        day: d,
        theme: dayTheme,
        locations: dayLocations,
        estimatedHours: dayHours > 0 ? Math.min(dayHours, 8) : 3,
        estimatedEntryFeeInr: dayFee,
      });
    }

    const stateObj = this.getStateSummary(targetState);
    const tips = [
      `Official timings: Most ASI heritage monuments open at sunrise (06:00) and close at sunset.`,
      `Foreign tourists can avail electronic queue-less ticketing via ASI / Incredible India portal.`,
      stateObj
        ? `Primary highlights in ${stateObj.name}: ${stateObj.top_destinations.join(', ')}.`
        : `Carry photo ID and water for historical walking trails.`,
      `Local transport: Prepaid auto-rickshaws and app-based cabs available across major tourist clusters.`,
    ];

    const allUsedLocs = daysPlan.flatMap((dp) => dp.locations);

    return {
      stateOrRegion: targetState,
      totalDays: days,
      totalAttractions: allUsedLocs.length,
      totalEntryFeeInr: totalEntryFee,
      daysPlan,
      suggestedRoute: routeOrder,
      travelTips: tips,
      sourceAttribution: {
        motVerifiedCount: allUsedLocs.filter((l) => l.sources.mot).length,
        osmGeoReferencedCount: allUsedLocs.filter((l) => l.sources.osm).length,
        natmoThematicCount: allUsedLocs.filter((l) => l.sources.natmo).length,
        geonamesHierarchyCount: allUsedLocs.filter((l) => l.sources.geonames).length,
      },
    };
  }

  /**
   * Helper: Haversine distance in kilometers
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const indiaTourismService = new IndiaTourismService();
