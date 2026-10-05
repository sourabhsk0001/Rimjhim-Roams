/**
 * India Tourism Knowledge Base Domain Types
 * Combines Ministry of Tourism (MoT), NATMO, OpenStreetMap (OSM), and GeoNames
 */

export type IndiaZone =
  | 'North'
  | 'South'
  | 'East'
  | 'West'
  | 'Central'
  | 'North-East'
  | 'Islands';

export type TourismCategory =
  | 'historical_monument'
  | 'temple'
  | 'heritage_palace'
  | 'beach'
  | 'national_park'
  | 'wildlife_sanctuary'
  | 'museum'
  | 'viewpoint'
  | 'natural_attraction'
  | 'hill_station'
  | 'waterfall'
  | 'cave'
  | 'cultural_hub'
  | 'lake'
  | 'fort'
  | 'pilgrimage_site';

export interface SourceProvenance {
  mot: boolean; // Ministry of Tourism (Official statistics, verified heritage, circuits)
  natmo: boolean; // NATMO (National Atlas & Thematic Mapping Organisation)
  osm: boolean; // OpenStreetMap (High-precision coordinates, POI attributes)
  geonames: boolean; // GeoNames (Administrative hierarchy: State -> District -> City)
  primary_source: 'Ministry of Tourism' | 'NATMO' | 'OpenStreetMap' | 'GeoNames';
  details?: {
    mot_circuit?: string;
    unesco_recognized?: boolean;
    osm_id?: string;
    geoname_id?: number;
    natmo_theme?: string;
  };
}

export interface AdministrativeHierarchy {
  country: 'India';
  state_ut: string;
  is_union_territory: boolean;
  zone: IndiaZone;
  district: string;
  sub_district?: string;
  city_town: string;
  pincode?: string;
  geonames_id?: number;
}

export interface OperationalMetadata {
  best_time_to_visit: string;
  ideal_duration_hours: number;
  opening_time: string;
  closing_time: string;
  entry_fee_inr: number;
  foreign_fee_inr?: number;
  nearest_airport?: string;
  nearest_railway?: string;
  climate?: string;
  timings_summary?: string;
  weather_suitability?: 'all_weather' | 'dry_preferred' | 'monsoon_scenic' | 'winter_best';
}

export interface IndiaTourismLocation {
  id: string; // Canonical slug e.g. "taj-mahal-agra"
  name: string;
  vernacular_name?: string;
  aliases: string[];
  state: string;
  district: string;
  city: string;
  latitude: number;
  longitude: number;
  category: TourismCategory;
  description: string;
  tourism_tags: string[];
  nearby_attractions: string[];
  sources: SourceProvenance;
  operational: OperationalMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface StateUTSummary {
  name: string;
  capital: string;
  is_union_territory: boolean;
  zone: IndiaZone;
  districts_count: number;
  major_attractions_count: number;
  top_destinations: string[];
  primary_tourism_themes: string[];
  description: string;
}

export interface IndiaTourismSearchFilter {
  query?: string;
  state?: string;
  district?: string;
  category?: TourismCategory | string;
  tag?: string;
  zone?: IndiaZone;
  maxEntryFee?: number;
  limit?: number;
  offset?: number;
}

export interface NearbyClusterQuery {
  latitude: number;
  longitude: number;
  radiusKm: number;
  category?: string;
  limit?: number;
}
