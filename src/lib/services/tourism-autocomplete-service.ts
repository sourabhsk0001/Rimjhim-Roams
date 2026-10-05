/**
 * NATMO & GeoNames Autocomplete Search Engine
 * Combines:
 * 1. GeoNames Administrative Hierarchy (28 States, 8 UTs, Districts, Cities)
 * 2. NATMO Thematic Circuits & Classifications
 * 3. Ministry of Tourism / OSM Verified Attractions & Vernacular Names
 */

import { ALL_STATES_AND_UTS, INDIA_TOURISM_LOCATIONS } from '@/lib/data/india-tourism-kb';
import {
  AutocompleteSuggestion,
  NATMOCircuitDefinition,
  NATMOTourismTheme,
} from '@/types/recommendations';

// ==============================================================================
// 1. Authoritative NATMO Thematic Spatial Circuits
// ==============================================================================

export const NATMO_THEMATIC_CIRCUITS: NATMOCircuitDefinition[] = [
  {
    id: 'golden-triangle-circuit',
    name: 'Golden Triangle Circuit',
    theme: 'Royal Forts & Palaces',
    zone: 'North',
    primaryStates: ['Delhi', 'Uttar Pradesh', 'Rajasthan'],
    keyDestinations: ['Delhi', 'Agra', 'Jaipur'],
    description:
      'India\'s most famous heritage trail linking Mughal imperial citadels with Rajput royal forts and the Taj Mahal.',
    bestMonths: 'October to March',
  },
  {
    id: 'desert-triangle-circuit',
    name: 'Desert Triangle & Thar Dunes Circuit',
    theme: 'Desert Safari & Dunes',
    zone: 'West',
    primaryStates: ['Rajasthan'],
    keyDestinations: ['Jaipur', 'Jodhpur', 'Jaisalmer'],
    description:
      'Sweeping desert expedition spanning pink stone palaces, the Blue City of Mehrangarh, and golden sand dunes of Sam.',
    bestMonths: 'November to February',
  },
  {
    id: 'buddhist-heritage-circuit',
    name: 'Buddhist Heritage & Enlightenment Circuit',
    theme: 'Spiritual & Pilgrimage',
    zone: 'East',
    primaryStates: ['Bihar', 'Uttar Pradesh'],
    keyDestinations: ['Bodh Gaya', 'Sarnath', 'Nalanda', 'Rajgir', 'Kushinagar'],
    description:
      'Sacred pilgrimage tracing the life of Gautama Buddha from enlightenment under the Bodhi Tree to Sarnath and ancient Nalanda.',
    bestMonths: 'October to March',
  },
  {
    id: 'spiritual-ganga-circuit',
    name: 'Spiritual Ganga Riverfront Circuit',
    theme: 'Spiritual & Pilgrimage',
    zone: 'North',
    primaryStates: ['Uttar Pradesh', 'Uttarakhand', 'Bihar'],
    keyDestinations: ['Varanasi', 'Prayagraj', 'Haridwar', 'Rishikesh'],
    description:
      'Sacred corridor along the holy Ganges featuring evening Maha Aartis, ancient stone bathing ghats, and Vedic ashrams.',
    bestMonths: 'September to April',
  },
  {
    id: 'malabar-coastal-circuit',
    name: 'Malabar Coast & Backwaters Circuit',
    theme: 'Coastal Beaches & Marine',
    zone: 'South',
    primaryStates: ['Kerala'],
    keyDestinations: ['Kochi', 'Alappuzha', 'Munnar', 'Kovalam'],
    description:
      'Verdant tropical route connecting colonial spice ports, Chinese fishing nets, serene houseboat waterways, and tea misted hills.',
    bestMonths: 'September to March',
  },
  {
    id: 'konkan-coastal-corridor',
    name: 'Konkan Coastal Paradise Corridor',
    theme: 'Coastal Beaches & Marine',
    zone: 'West',
    primaryStates: ['Goa', 'Maharashtra', 'Karnataka'],
    keyDestinations: ['North Goa', 'South Goa', 'Old Goa', 'Dudhsagar'],
    description:
      'Golden coastline of Portuguese Baroque churches, fringed palm coves, vibrant beach markets, and Western Ghats waterfalls.',
    bestMonths: 'October to May',
  },
  {
    id: 'royal-bengal-tiger-circuit',
    name: 'Royal Bengal Tiger & Wildlife Circuit',
    theme: 'Wildlife & Tiger Reserves',
    zone: 'Central',
    primaryStates: ['Rajasthan', 'Madhya Pradesh', 'Uttarakhand', 'Assam'],
    keyDestinations: ['Ranthambore', 'Bandhavgarh', 'Kanha', 'Corbett', 'Kaziranga'],
    description:
      'Premier safari expedition through dense sal and deciduous jungles tracking wild Bengal tigers and one-horned rhinos.',
    bestMonths: 'October to May',
  },
  {
    id: 'dravidian-temple-architecture-circuit',
    name: 'Dravidian Temple Architecture Circuit',
    theme: 'Ancient Caves & Rock Architecture',
    zone: 'South',
    primaryStates: ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh'],
    keyDestinations: ['Madurai', 'Thanjavur', 'Hampi', 'Tirupati', 'Mahabalipuram'],
    description:
      'Masterpieces of rock-cut monolithic art, soaring gopurams, and UNESCO Vijayanagara stone architecture.',
    bestMonths: 'October to March',
  },
  {
    id: 'eastern-himalayan-monasteries',
    name: 'Eastern Himalayan Monasteries & Valley Circuit',
    theme: 'Himalayan Valleys & Monasteries',
    zone: 'North-East',
    primaryStates: ['Arunachal Pradesh', 'Sikkim', 'Meghalaya'],
    keyDestinations: ['Tawang', 'Gangtok', 'Ziro Valley', 'Shillong'],
    description:
      'Alpine high-altitude circuit featuring 17th-century Tawang Gompa, sacred glacial lakes, and tribal living root bridges.',
    bestMonths: 'March to June, October to December',
  },
  {
    id: 'western-ghats-tea-plantations',
    name: 'Western Ghats Tea & Coffee Mountain Circuit',
    theme: 'Tea Gardens & Hill Stations',
    zone: 'South',
    primaryStates: ['Kerala', 'Karnataka', 'Tamil Nadu'],
    keyDestinations: ['Munnar', 'Coorg', 'Ooty', 'Wayanad'],
    description:
      'Cool mountain escape cloaked in emerald tea estates, spice plantations, and Western Ghats bio-diverse peaks.',
    bestMonths: 'All Year (September to May ideal)',
  },
  {
    id: 'coral-atolls-marine-circuit',
    name: 'Coral Atolls & Emerald Islands Circuit',
    theme: 'Coastal Beaches & Marine',
    zone: 'Islands',
    primaryStates: ['Andaman and Nicobar Islands', 'Lakshadweep'],
    keyDestinations: ['Port Blair', 'Havelock (Swaraj Dweep)', 'Agatti Island', 'Bangaram'],
    description:
      'Pristine turquoise lagoons, living coral atolls, bioluminescent waters, and historical colonial landmarks.',
    bestMonths: 'October to May',
  },
];

// ==============================================================================
// 2. Autocomplete Engine Class
// ==============================================================================

export class TourismAutocompleteService {
  private suggestionsIndex: AutocompleteSuggestion[] = [];

  constructor() {
    this.buildIndex();
  }

  /**
   * Builds the in-memory autocomplete index across GeoNames, NATMO, and MoT data
   */
  private buildIndex(): void {
    const items: AutocompleteSuggestion[] = [];
    const seenKeys = new Set<string>();

    // A. GeoNames States and Union Territories (36 total)
    for (const state of ALL_STATES_AND_UTS) {
      const typeLabel = state.is_union_territory ? 'Union Territory' : 'State';
      const key = `state_${state.name.toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        items.push({
          id: `geonames-state-${state.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          title: state.name,
          subtitle: `${state.zone} India · Capital: ${state.capital} (${typeLabel})`,
          type: 'state',
          state: state.name,
          badge: `GeoNames ${typeLabel}`,
          natmoTheme: state.primary_tourism_themes[0],
          score: 80,
        });
      }
    }

    // B. NATMO Thematic Circuits
    for (const circuit of NATMO_THEMATIC_CIRCUITS) {
      const key = `natmo_${circuit.name.toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        items.push({
          id: `natmo-circuit-${circuit.id}`,
          title: circuit.name,
          subtitle: `NATMO Thematic Circuit · ${circuit.theme} (${circuit.primaryStates.join(', ')})`,
          type: 'natmo_circuit',
          natmoTheme: circuit.theme,
          state: circuit.primaryStates[0],
          badge: 'NATMO Thematic Circuit',
          score: 85,
        });
      }
    }

    // C. GeoNames Districts and Cities from Knowledge Base
    const districtStateMap = new Map<string, { state: string; city: string }>();
    for (const loc of INDIA_TOURISM_LOCATIONS) {
      const distKey = `${loc.district.toLowerCase()}_${loc.state.toLowerCase()}`;
      if (!districtStateMap.has(distKey)) {
        districtStateMap.set(distKey, { state: loc.state, city: loc.city });
      }
    }

    for (const [distKey, data] of Array.from(districtStateMap.entries())) {
      const districtName = distKey.split('_')[0].replace(/\b\w/g, (c) => c.toUpperCase());
      const key = `district_${distKey}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        items.push({
          id: `geonames-district-${districtName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          title: `${districtName} District`,
          subtitle: `District in ${data.state} · Hub: ${data.city}`,
          type: 'district',
          state: data.state,
          district: districtName,
          badge: 'GeoNames District',
          score: 75,
        });
      }
    }

    // D. Ministry of Tourism & OSM Curated Attractions
    for (const loc of INDIA_TOURISM_LOCATIONS) {
      const key = `attraction_${loc.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        const circuit = loc.sources.details?.mot_circuit || loc.sources.details?.natmo_theme;
        const unesco = loc.sources.details?.unesco_recognized ? 'UNESCO ' : '';
        const badgeLabel = unesco ? 'UNESCO / MoT' : 'MoT & OSM Site';

        items.push({
          id: loc.id,
          title: loc.name,
          subtitle: `${loc.city}, ${loc.state} · ${circuit ? `${circuit} · ` : ''}${loc.category.replace('_', ' ')}`,
          type: 'attraction',
          category: loc.category,
          state: loc.state,
          district: loc.district,
          coordinates: {
            lat: loc.latitude,
            lng: loc.longitude,
          },
          badge: badgeLabel,
          score: unesco ? 95 : 90,
        });
      }
    }

    this.suggestionsIndex = items;
  }

  /**
   * Generates ranked autocomplete suggestions for a search term
   */
  public getSuggestions(query: string, limit: number = 8): AutocompleteSuggestion[] {
    const clean = query.trim().toLowerCase();
    if (!clean) {
      // Return top highlighted national circuits and states when search is empty
      return this.suggestionsIndex
        .filter((s) => s.type === 'natmo_circuit' || s.type === 'state')
        .slice(0, limit);
    }

    const scored: Array<AutocompleteSuggestion & { rankScore: number }> = [];

    for (const item of this.suggestionsIndex) {
      const titleLower = item.title.toLowerCase();
      const subtitleLower = item.subtitle.toLowerCase();
      const stateLower = (item.state || '').toLowerCase();
      const districtLower = (item.district || '').toLowerCase();
      const themeLower = (item.natmoTheme || '').toLowerCase();

      let rankScore = 0;

      // 1. Exact match on title prefix: massive boost
      if (titleLower.startsWith(clean)) {
        rankScore += 120;
      }
      // 2. Word boundary match on title (e.g. "fort" matches "Amber Fort")
      else if (new RegExp(`\\b${clean}`, 'i').test(titleLower)) {
        rankScore += 80;
      }
      // 3. Substring match in title
      else if (titleLower.includes(clean)) {
        rankScore += 50;
      }

      // 4. State or District exact prefix / word match
      if (stateLower.startsWith(clean)) {
        rankScore += 60;
      } else if (stateLower.includes(clean)) {
        rankScore += 30;
      }

      if (districtLower.startsWith(clean)) {
        rankScore += 55;
      } else if (districtLower.includes(clean)) {
        rankScore += 25;
      }

      // 5. NATMO theme match
      if (themeLower.includes(clean)) {
        rankScore += 35;
      }

      // 6. Subtitle match
      if (subtitleLower.includes(clean)) {
        rankScore += 20;
      }

      if (rankScore > 0) {
        scored.push({
          ...item,
          rankScore: rankScore + item.score,
        });
      }
    }

    // Sort by computed rank score descending
    scored.sort((a, b) => b.rankScore - a.rankScore);

    return scored.slice(0, limit).map(({ rankScore, ...rest }) => rest);
  }

  /**
   * Returns all NATMO circuits
   */
  public getAllCircuits(): NATMOCircuitDefinition[] {
    return NATMO_THEMATIC_CIRCUITS;
  }

  /**
   * Retrieves a NATMO circuit by its ID
   */
  public getCircuitById(id: string): NATMOCircuitDefinition | undefined {
    return NATMO_THEMATIC_CIRCUITS.find(
      (c) => c.id === id || c.id.replace(/-circuit$/, '') === id.replace(/-circuit$/, '')
    );
  }
}

export const tourismAutocompleteService = new TourismAutocompleteService();
