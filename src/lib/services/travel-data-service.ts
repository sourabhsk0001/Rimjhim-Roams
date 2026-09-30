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
// Comprehensive Seed DEMO Data for 8 Required Destinations
// ==============================================================================

export const DEMO_DESTINATIONS: Destination[] = [
  {
    id: "dest-goa",
    name: "Goa",
    state_province: "Goa",
    country: "India",
    description:
      "Tropical coastal paradise renowned for its pristine beaches, vibrant nightlife, Portuguese colonial architecture, and fresh coastal seafood.",
    latitude: 15.2993,
    longitude: 74.124,
    climate: "Tropical Coastal",
    best_time_to_visit: "November to March",
    hero_image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1000&auto=format&fit=crop",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "dest-jaipur",
    name: "Jaipur",
    state_province: "Rajasthan",
    country: "India",
    description:
      "The legendary 'Pink City' celebrated for grand royal palaces, ancient forts, vibrant bazaar culture, and rich Rajputana heritage.",
    latitude: 26.9124,
    longitude: 75.7873,
    climate: "Semi-Arid Warm",
    best_time_to_visit: "October to March",
    hero_image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?q=80&w=1000&auto=format&fit=crop",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "dest-darjeeling",
    name: "Darjeeling",
    state_province: "West Bengal",
    country: "India",
    description:
      "Majestic Himalayan hill station framed by snow-peaked Mount Kanchenjunga, emerald tea estates, and the historic UNESCO Toy Train.",
    latitude: 27.041,
    longitude: 88.2663,
    climate: "Alpine Temperate",
    best_time_to_visit: "April to June & October to December",
    hero_image: "https://images.unsplash.com/photo-1622308644420-a7d5cb18e55e?q=80&w=1000&auto=format&fit=crop",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "dest-delhi",
    name: "Delhi",
    state_province: "National Capital Territory",
    country: "India",
    description:
      "India's bustling capital blending millennia of architectural marvels from Mughal domes to British colonial boulevards and iconic food streets.",
    latitude: 28.6139,
    longitude: 77.209,
    climate: "Continental Subtropical",
    best_time_to_visit: "October to March",
    hero_image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=1000&auto=format&fit=crop",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "dest-mumbai",
    name: "Mumbai",
    state_province: "Maharashtra",
    country: "India",
    description:
      "The city of dreams and commerce on the Arabian Sea, home to Bollywood, grand Victorian architecture, and the buzzing Marine Drive promenade.",
    latitude: 19.076,
    longitude: 72.8777,
    climate: "Tropical Maritime",
    best_time_to_visit: "November to February",
    hero_image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1000&auto=format&fit=crop",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "dest-kolkata",
    name: "Kolkata",
    state_province: "West Bengal",
    country: "India",
    description:
      "The cultural capital of India, steeped in literary arts, grand colonial monuments like Victoria Memorial, historic trams, and gourmet Bengali sweets.",
    latitude: 22.5726,
    longitude: 88.3639,
    climate: "Tropical Wet & Dry",
    best_time_to_visit: "October to February",
    hero_image: "https://images.unsplash.com/photo-1558431382-27e303142255?q=80&w=1000&auto=format&fit=crop",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "dest-manali",
    name: "Manali",
    state_province: "Himachal Pradesh",
    country: "India",
    description:
      "High-altitude mountain wonderland in the Beas River Valley, renowned for skiing, hiking in Solang Valley, pine forests, and Rohtang Pass.",
    latitude: 32.2432,
    longitude: 77.1892,
    climate: "Alpine Continental",
    best_time_to_visit: "March to June & October to February",
    hero_image: "https://images.unsplash.com/photo-1571401835393-8c5f35328320?q=80&w=1000&auto=format&fit=crop",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "dest-bengaluru",
    name: "Bengaluru",
    state_province: "Karnataka",
    country: "India",
    description:
      "India's Silicon Valley and Garden City, celebrated for year-round pleasant weather, expansive public parks, craft breweries, and tech innovation.",
    latitude: 12.9716,
    longitude: 77.5946,
    climate: "Tropical Savanna / Mild",
    best_time_to_visit: "September to March",
    hero_image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?q=80&w=1000&auto=format&fit=crop",
    source: "DEMO",
    data_status: "DEMO",
  },
];

export const DEMO_ATTRACTIONS: Attraction[] = [
  // Goa
  {
    id: "attr-goa-1",
    destination_id: "dest-goa",
    name: "Aguada Fort & Lighthouse",
    description: "Well-preserved 17th-century Portuguese fort standing on Sinquerim Beach overlooking the Arabian Sea.",
    category: "Historical Monument",
    latitude: 15.492,
    longitude: 73.7737,
    opening_time: "09:30 AM",
    closing_time: "06:00 PM",
    ticket_price: 50,
    currency: "INR",
    minimum_visit_minutes: 45,
    recommended_visit_minutes: 90,
    maximum_visit_minutes: 150,
    best_visit_start: "04:00 PM",
    best_visit_end: "06:00 PM",
    peak_start: "03:00 PM",
    peak_end: "05:30 PM",
    estimated_queue_minutes: 15,
    weather_suitability: "Sunny / Clear Sky",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "attr-goa-2",
    destination_id: "dest-goa",
    name: "Basilica of Bom Jesus",
    description: "UNESCO World Heritage Roman Catholic basilica holding the mortal remains of St. Francis Xavier.",
    category: "Religious Heritage",
    latitude: 15.5009,
    longitude: 73.9116,
    opening_time: "09:00 AM",
    closing_time: "06:30 PM",
    ticket_price: 0,
    currency: "INR",
    minimum_visit_minutes: 30,
    recommended_visit_minutes: 60,
    maximum_visit_minutes: 120,
    best_visit_start: "09:30 AM",
    best_visit_end: "11:30 AM",
    peak_start: "11:00 AM",
    peak_end: "02:00 PM",
    estimated_queue_minutes: 20,
    weather_suitability: "All Weather",
    source: "DEMO",
    data_status: "DEMO",
  },
  // Jaipur
  {
    id: "attr-jaipur-1",
    destination_id: "dest-jaipur",
    name: "Amber Fort & Palace",
    description: "Opulent hilltop fortress built of red sandstone and marble featuring the world-famous Sheesh Mahal mirror palace.",
    category: "Fortress & Palace",
    latitude: 26.9855,
    longitude: 75.8513,
    opening_time: "08:00 AM",
    closing_time: "05:30 PM",
    ticket_price: 100,
    currency: "INR",
    minimum_visit_minutes: 90,
    recommended_visit_minutes: 180,
    maximum_visit_minutes: 240,
    best_visit_start: "08:30 AM",
    best_visit_end: "11:00 AM",
    peak_start: "11:30 AM",
    peak_end: "03:30 PM",
    estimated_queue_minutes: 25,
    weather_suitability: "Mild / Sunny",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "attr-jaipur-2",
    destination_id: "dest-jaipur",
    name: "Hawa Mahal (Palace of Winds)",
    description: "Iconic five-story pink sandstone palace adorned with 953 intricately carved jharokhas (casements).",
    category: "Architectural Marvel",
    latitude: 26.9239,
    longitude: 75.8267,
    opening_time: "09:00 AM",
    closing_time: "05:00 PM",
    ticket_price: 50,
    currency: "INR",
    minimum_visit_minutes: 30,
    recommended_visit_minutes: 60,
    maximum_visit_minutes: 90,
    best_visit_start: "09:00 AM",
    best_visit_end: "10:30 AM",
    peak_start: "01:00 PM",
    peak_end: "04:00 PM",
    estimated_queue_minutes: 10,
    weather_suitability: "Clear / Daylight",
    source: "DEMO",
    data_status: "DEMO",
  },
  // Darjeeling
  {
    id: "attr-darjeeling-1",
    destination_id: "dest-darjeeling",
    name: "Tiger Hill Sunrise Point",
    description: "Panoramic vantage point famous for witnessing dawn illuminate Mount Kanchenjunga and Mount Everest in golden light.",
    category: "Nature & Viewpoint",
    latitude: 26.9958,
    longitude: 88.2862,
    opening_time: "04:00 AM",
    closing_time: "06:00 PM",
    ticket_price: 80,
    currency: "INR",
    minimum_visit_minutes: 60,
    recommended_visit_minutes: 120,
    maximum_visit_minutes: 180,
    best_visit_start: "04:30 AM",
    best_visit_end: "06:30 AM",
    peak_start: "04:15 AM",
    peak_end: "06:00 AM",
    estimated_queue_minutes: 30,
    weather_suitability: "Clear Dawn",
    source: "DEMO",
    data_status: "DEMO",
  },
  // Delhi
  {
    id: "attr-delhi-1",
    destination_id: "dest-delhi",
    name: "Qutub Minar & Mehrauli Archaeological Park",
    description: "Victory tower standing 72.5 meters tall, built in 1192 and surrounded by ancient iron pillars and tombs.",
    category: "UNESCO Heritage",
    latitude: 28.5244,
    longitude: 77.1855,
    opening_time: "07:00 AM",
    closing_time: "07:00 PM",
    ticket_price: 50,
    currency: "INR",
    minimum_visit_minutes: 60,
    recommended_visit_minutes: 120,
    maximum_visit_minutes: 180,
    best_visit_start: "08:00 AM",
    best_visit_end: "10:30 AM",
    peak_start: "01:00 PM",
    peak_end: "04:00 PM",
    estimated_queue_minutes: 15,
    weather_suitability: "Clear / Outdoor",
    source: "DEMO",
    data_status: "DEMO",
  },
  // Mumbai
  {
    id: "attr-mumbai-1",
    destination_id: "dest-mumbai",
    name: "Gateway of India",
    description: "Arch-monument erected to commemorate the landing of King George V, located at Apollo Bunder overlooking the Arabian Sea.",
    category: "Historic Landmark",
    latitude: 18.922,
    longitude: 72.8347,
    opening_time: "Open 24 Hours",
    closing_time: "Open 24 Hours",
    ticket_price: 0,
    currency: "INR",
    minimum_visit_minutes: 30,
    recommended_visit_minutes: 60,
    maximum_visit_minutes: 120,
    best_visit_start: "05:00 PM",
    best_visit_end: "07:30 PM",
    peak_start: "04:00 PM",
    peak_end: "08:00 PM",
    estimated_queue_minutes: 0,
    weather_suitability: "Breezy / Sunset",
    source: "DEMO",
    data_status: "DEMO",
  },
  // Kolkata
  {
    id: "attr-kolkata-1",
    destination_id: "dest-kolkata",
    name: "Victoria Memorial Hall",
    description: "Grand white marble palace building dedicated to Queen Victoria, surrounded by lush landscaped gardens and museum halls.",
    category: "Museum & Gardens",
    latitude: 22.5448,
    longitude: 88.3426,
    opening_time: "10:00 AM",
    closing_time: "06:00 PM",
    ticket_price: 50,
    currency: "INR",
    minimum_visit_minutes: 60,
    recommended_visit_minutes: 120,
    maximum_visit_minutes: 180,
    best_visit_start: "10:30 AM",
    best_visit_end: "01:00 PM",
    peak_start: "02:00 PM",
    peak_end: "05:00 PM",
    estimated_queue_minutes: 15,
    weather_suitability: "All Weather",
    source: "DEMO",
    data_status: "DEMO",
  },
  // Manali
  {
    id: "attr-manali-1",
    destination_id: "dest-manali",
    name: "Solang Valley Adventure Grounds",
    description: "Picturesque valley offering paragliding, zorbing, and snow sports surrounded by glaciers and mountain peaks.",
    category: "Adventure & Alpine",
    latitude: 32.3166,
    longitude: 77.1578,
    opening_time: "09:00 AM",
    closing_time: "06:00 PM",
    ticket_price: 0,
    currency: "INR",
    minimum_visit_minutes: 120,
    recommended_visit_minutes: 240,
    maximum_visit_minutes: 360,
    best_visit_start: "09:30 AM",
    best_visit_end: "01:30 PM",
    peak_start: "11:00 AM",
    peak_end: "03:00 PM",
    estimated_queue_minutes: 30,
    weather_suitability: "Clear / Snow",
    source: "DEMO",
    data_status: "DEMO",
  },
  // Bengaluru
  {
    id: "attr-bengaluru-1",
    destination_id: "dest-bengaluru",
    name: "Lalbagh Botanical Garden & Glass House",
    description: "Centuries-old botanical sanctuary spanning 240 acres with rare tropical flora and an 1889 glass house inspired by London's Crystal Palace.",
    category: "Botanical Garden",
    latitude: 12.9507,
    longitude: 77.5848,
    opening_time: "06:00 AM",
    closing_time: "07:00 PM",
    ticket_price: 30,
    currency: "INR",
    minimum_visit_minutes: 60,
    recommended_visit_minutes: 120,
    maximum_visit_minutes: 180,
    best_visit_start: "07:00 AM",
    best_visit_end: "09:30 AM",
    peak_start: "09:00 AM",
    peak_end: "11:30 AM",
    estimated_queue_minutes: 5,
    weather_suitability: "Morning Walk / Pleasant",
    source: "DEMO",
    data_status: "DEMO",
  },
];

export const DEMO_HOTELS: Hotel[] = [
  // Goa
  {
    id: "hotel-goa-1",
    destination_id: "dest-goa",
    name: "Taj Fort Aguada Resort & Spa",
    latitude: 15.4952,
    longitude: 73.7709,
    price_per_night: 18500,
    currency: "INR",
    rating: 4.8,
    amenities: ["Ocean View", "Private Beach", "Infinity Pool", "Ayurvedic Spa", "Free Breakfast"],
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "hotel-goa-2",
    destination_id: "dest-goa",
    name: "Santana Beach Resort Candolim",
    latitude: 15.5126,
    longitude: 73.7634,
    price_per_night: 4200,
    currency: "INR",
    rating: 4.4,
    amenities: ["Swimming Pool", "Beach Access", "Free WiFi", "Garden Restaurant"],
    source: "DEMO",
    data_status: "DEMO",
  },
  // Jaipur
  {
    id: "hotel-jaipur-1",
    destination_id: "dest-jaipur",
    name: "Rambagh Palace Jaipur",
    latitude: 26.8978,
    longitude: 75.8087,
    price_per_night: 35000,
    currency: "INR",
    rating: 4.9,
    amenities: ["Royal Heritage Suites", "Fine Dining", "Peacock Gardens", "Butler Service"],
    source: "DEMO",
    data_status: "DEMO",
  },
  // Delhi
  {
    id: "hotel-delhi-1",
    destination_id: "dest-delhi",
    name: "The Imperial New Delhi",
    latitude: 28.6231,
    longitude: 77.2185,
    price_per_night: 16000,
    currency: "INR",
    rating: 4.7,
    amenities: ["Art Deco Architecture", "Outdoor Pool", "Spa", "Historic Bar"],
    source: "DEMO",
    data_status: "DEMO",
  },
  // Bengaluru
  {
    id: "hotel-bengaluru-1",
    destination_id: "dest-bengaluru",
    name: "The Leela Palace Bengaluru",
    latitude: 12.9606,
    longitude: 77.6484,
    price_per_night: 14500,
    currency: "INR",
    rating: 4.8,
    amenities: ["Lush Gardens", "Fine Dining", "Outdoor Pool", "High-Speed WiFi"],
    source: "DEMO",
    data_status: "DEMO",
  },
];

export const DEMO_RESTAURANTS: Restaurant[] = [
  // Goa
  {
    id: "rest-goa-1",
    destination_id: "dest-goa",
    name: "Fisherman's Wharf Panaji",
    latitude: 15.4989,
    longitude: 73.8278,
    cuisine: "Goan & Coastal Seafood",
    price_level: "$$",
    estimated_price_per_person: 900,
    dietary_options: ["Gluten-Free", "Halal Options", "Pescatarian"],
    source: "DEMO",
    data_status: "DEMO",
  },
  // Jaipur
  {
    id: "rest-jaipur-1",
    destination_id: "dest-jaipur",
    name: "1135 AD Amer",
    latitude: 26.9863,
    longitude: 75.852,
    cuisine: "Authentic Rajasthani Royal Thali",
    price_level: "$$$",
    estimated_price_per_person: 2200,
    dietary_options: ["Vegetarian", "Vegan Options", "Jain Friendly"],
    source: "DEMO",
    data_status: "DEMO",
  },
  // Delhi
  {
    id: "rest-delhi-1",
    destination_id: "dest-delhi",
    name: "Karim's Old Delhi",
    latitude: 28.6508,
    longitude: 77.2334,
    cuisine: "Mughlai & Kebabs",
    price_level: "$$",
    estimated_price_per_person: 650,
    dietary_options: ["Halal", "Non-Vegetarian Specialists"],
    source: "DEMO",
    data_status: "DEMO",
  },
  // Bengaluru
  {
    id: "rest-bengaluru-1",
    destination_id: "dest-bengaluru",
    name: "Mavalli Tiffin Room (MTR) Lalbagh",
    latitude: 12.9545,
    longitude: 77.5855,
    cuisine: "Traditional South Indian & Filter Coffee",
    price_level: "$",
    estimated_price_per_person: 250,
    dietary_options: ["Pure Vegetarian", "Vegan Options", "Jain Friendly"],
    source: "DEMO",
    data_status: "DEMO",
  },
];

export const DEMO_TRANSPORT: TransportOption[] = [
  // Delhi -> Jaipur
  {
    id: "trans-1",
    destination_id: "dest-jaipur",
    origin: "New Delhi",
    destination: "Jaipur",
    mode: "train",
    provider: "Vande Bharat Express",
    departure: "06:10 AM",
    arrival: "10:05 AM",
    duration_minutes: 235,
    price: 1050,
    currency: "INR",
    transfers: 0,
    source: "DEMO",
    data_status: "DEMO",
  },
  // Mumbai -> Goa
  {
    id: "trans-2",
    destination_id: "dest-goa",
    origin: "Mumbai (CSMT)",
    destination: "Goa (Madgaon)",
    mode: "train",
    provider: "Tejas Express",
    departure: "05:50 AM",
    arrival: "02:30 PM",
    duration_minutes: 520,
    price: 1540,
    currency: "INR",
    transfers: 0,
    source: "DEMO",
    data_status: "DEMO",
  },
  // Bengaluru -> Goa
  {
    id: "trans-3",
    destination_id: "dest-goa",
    origin: "Bengaluru (BLR)",
    destination: "Goa (GOI)",
    mode: "flight",
    provider: "IndiGo 6E-654",
    departure: "11:20 AM",
    arrival: "12:35 PM",
    duration_minutes: 75,
    price: 3400,
    currency: "INR",
    transfers: 0,
    source: "DEMO",
    data_status: "DEMO",
  },
];

export const DEMO_TAXIS: TaxiOption[] = [
  {
    id: "taxi-1",
    destination_id: "dest-goa",
    name: "GoaMiles Prepaid Cab",
    vehicle_type: "Sedan (AC)",
    base_fare: 250,
    price_per_km: 24,
    currency: "INR",
    source: "DEMO",
    data_status: "DEMO",
  },
  {
    id: "taxi-2",
    destination_id: "dest-jaipur",
    name: "Pink City Auto & Cab Service",
    vehicle_type: "Hatchback / Auto",
    base_fare: 100,
    price_per_km: 16,
    currency: "INR",
    source: "DEMO",
    data_status: "DEMO",
  },
];

// ==============================================================================
// Spatial Helper: Haversine Distance (in Kilometers)
// ==============================================================================

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

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
