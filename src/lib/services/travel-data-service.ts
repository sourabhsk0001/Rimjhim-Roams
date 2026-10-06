import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  Destination,
  Attraction,
  Hotel,
  Restaurant,
  TransportOption,
  TaxiOption,
  NearbyLocationResult,
} from "@/types/travel";

// ==============================================================================
// Re-export Seed DEMO Data & Distance Helper from Decoupled Module
// ==============================================================================

export * from "@/lib/data/travel-demo-data";
import {
  DEMO_DESTINATIONS,
  DEMO_ATTRACTIONS,
  DEMO_HOTELS,
  DEMO_RESTAURANTS,
  DEMO_TRANSPORT,
  DEMO_TAXIS,
  calculateDistanceKm,
} from "@/lib/data/travel-demo-data";

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("mock-project") && key !== "mock-anon-key");
}

// ==============================================================================
// Service Query Methods
// ==============================================================================

export async function getDestinations(
  searchTerm?: string,
  climate?: string
): Promise<Destination[]> {
  if (!isSupabaseLive()) {
    let result = DEMO_DESTINATIONS;
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.state_province.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }
    if (climate && climate !== "all") {
      result = result.filter((d) =>
        d.climate.toLowerCase().includes(climate.toLowerCase())
      );
    }
    return result;
  }

  try {
    const supabase = createServerSupabase();
    let query = supabase.from("destinations").select("*");

    if (searchTerm && searchTerm.trim()) {
      query = query.ilike("name", `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return DEMO_DESTINATIONS;
    }
    return data as Destination[];
  } catch {
    return DEMO_DESTINATIONS;
  }
}

export async function getDestinationById(id: string): Promise<Destination | null> {
  if (!isSupabaseLive()) {
    const found = DEMO_DESTINATIONS.find((d) => d.id === id);
    return found || null;
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("destinations")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return DEMO_DESTINATIONS.find((d) => d.id === id) || null;
    }
    return data as Destination;
  } catch {
    return DEMO_DESTINATIONS.find((d) => d.id === id) || null;
  }
}

export async function getDestinationAttractions(
  destinationId: string
): Promise<Attraction[]> {
  if (!isSupabaseLive()) {
    return DEMO_ATTRACTIONS.filter((a) => a.destination_id === destinationId);
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("attractions")
      .select("*")
      .eq("destination_id", destinationId);

    if (error || !data || data.length === 0) {
      return DEMO_ATTRACTIONS.filter((a) => a.destination_id === destinationId);
    }
    return data as Attraction[];
  } catch {
    return DEMO_ATTRACTIONS.filter((a) => a.destination_id === destinationId);
  }
}

export async function getDestinationHotels(
  destinationId: string
): Promise<Hotel[]> {
  if (!isSupabaseLive()) {
    return DEMO_HOTELS.filter((h) => h.destination_id === destinationId);
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("destination_id", destinationId);

    if (error || !data || data.length === 0) {
      return DEMO_HOTELS.filter((h) => h.destination_id === destinationId);
    }
    return data as Hotel[];
  } catch {
    return DEMO_HOTELS.filter((h) => h.destination_id === destinationId);
  }
}

export async function getDestinationRestaurants(
  destinationId: string
): Promise<Restaurant[]> {
  if (!isSupabaseLive()) {
    return DEMO_RESTAURANTS.filter((r) => r.destination_id === destinationId);
  }

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("destination_id", destinationId);

    if (error || !data || data.length === 0) {
      return DEMO_RESTAURANTS.filter((r) => r.destination_id === destinationId);
    }
    return data as Restaurant[];
  } catch {
    return DEMO_RESTAURANTS.filter((r) => r.destination_id === destinationId);
  }
}

export async function getDestinationTransport(
  destinationId: string
): Promise<{ transport: TransportOption[]; taxis: TaxiOption[] }> {
  if (!isSupabaseLive()) {
    const transport = DEMO_TRANSPORT.filter(
      (t) => t.destination_id === destinationId
    );
    const taxis = DEMO_TAXIS.filter((tx) => tx.destination_id === destinationId);
    return { transport, taxis };
  }

  try {
    const supabase = createServerSupabase();
    const [tRes, txRes] = await Promise.all([
      supabase.from("transport_options").select("*").eq("destination_id", destinationId),
      supabase.from("taxi_options").select("*").eq("destination_id", destinationId),
    ]);

    const transport =
      tRes.data && tRes.data.length > 0
        ? (tRes.data as TransportOption[])
        : DEMO_TRANSPORT.filter((t) => t.destination_id === destinationId);

    const taxis =
      txRes.data && txRes.data.length > 0
        ? (txRes.data as TaxiOption[])
        : DEMO_TAXIS.filter((tx) => tx.destination_id === destinationId);

    return { transport, taxis };
  } catch {
    return {
      transport: DEMO_TRANSPORT.filter((t) => t.destination_id === destinationId),
      taxis: DEMO_TAXIS.filter((tx) => tx.destination_id === destinationId),
    };
  }
}

export async function findNearbyAttractions(
  targetLat: number,
  targetLng: number,
  radiusKm: number = 25
): Promise<NearbyLocationResult[]> {
  if (!isSupabaseLive()) {
    return DEMO_ATTRACTIONS.map((attr) => {
      const distance = calculateDistanceKm(
        targetLat,
        targetLng,
        attr.latitude,
        attr.longitude
      );
      return {
        id: attr.id,
        name: attr.name,
        category: attr.category,
        latitude: attr.latitude,
        longitude: attr.longitude,
        ticket_price: attr.ticket_price,
        distance_km: distance,
        data_status: attr.data_status,
      };
    })
      .filter((item) => item.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km);
  }

  try {
    const supabase = createServerSupabase();
    // @ts-expect-error Supabase rpc call for PostGIS function
    const { data, error } = await supabase.rpc("find_nearby_attractions", {
      target_lat: targetLat,
      target_lng: targetLng,
      radius_km: radiusKm,
    });

    if (error || !data) {
      // Fallback to in-memory spatial distance calculation
      return DEMO_ATTRACTIONS.map((attr) => ({
        id: attr.id,
        name: attr.name,
        category: attr.category,
        latitude: attr.latitude,
        longitude: attr.longitude,
        ticket_price: attr.ticket_price,
        distance_km: calculateDistanceKm(
          targetLat,
          targetLng,
          attr.latitude,
          attr.longitude
        ),
        data_status: attr.data_status,
      }))
        .filter((item) => item.distance_km <= radiusKm)
        .sort((a, b) => a.distance_km - b.distance_km);
    }

    return data as NearbyLocationResult[];
  } catch {
    return [];
  }
}
