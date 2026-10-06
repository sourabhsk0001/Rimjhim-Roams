/**
 * Destination Transit Hubs Registry
 * Provides high-precision coordinates, ratings, typical transfer times,
 * and estimated transportation fares for Airports, Railway Stations, and Taxi Pickup Stands.
 */

export interface TransitHub {
  id: string;
  destinationId: string;
  name: string;
  type: "airport" | "railway" | "taxi";
  code?: string; // IATA (e.g. DEL, BOM, GOI) or Station Code (e.g. NDLS, CSMT, MAO)
  latitude: number;
  longitude: number;
  rating: number;
  reviewsCount?: number;
  distanceToCenterKm: number;
  typicalTransferMinutes: number;
  estimatedTransferCostInr: number;
  description: string;
  vehicleType?: string; // e.g. "Prepaid Taxi & App Cabs", "AC Sedan & Auto-rickshaw"
  operatingHours?: string;
  facilities?: string[];
}

export const DESTINATION_TRANSIT_HUBS: Record<string, TransitHub[]> = {
  // 1. Goa
  "dest-goa": [
    {
      id: "hub-goa-airport-goi",
      destinationId: "dest-goa",
      name: "Dabolim International Airport (GOI)",
      type: "airport",
      code: "GOI",
      latitude: 15.3808,
      longitude: 73.8314,
      rating: 4.4,
      reviewsCount: 18450,
      distanceToCenterKm: 28,
      typicalTransferMinutes: 45,
      estimatedTransferCostInr: 950,
      description: "Primary South & Central Goa air gateway with 24/7 GoaMiles prepaid counters.",
      operatingHours: "24 Hours",
      facilities: ["Prepaid Taxi Desk", "ATM", "Cafes", "Duty Free"],
    },
    {
      id: "hub-goa-airport-gox",
      destinationId: "dest-goa",
      name: "Manohar International Airport, Mopa (GOX)",
      type: "airport",
      code: "GOX",
      latitude: 15.7667,
      longitude: 73.8667,
      rating: 4.6,
      reviewsCount: 9230,
      distanceToCenterKm: 34,
      typicalTransferMinutes: 55,
      estimatedTransferCostInr: 1350,
      description: "State-of-the-art North Goa international airport connecting Calangute & Panaji.",
      operatingHours: "24 Hours",
      facilities: ["EV Cabs", "GoaMiles Counter", "Express Bus"],
    },
    {
      id: "hub-goa-railway-mao",
      destinationId: "dest-goa",
      name: "Madgaon Junction Railway Station (MAO)",
      type: "railway",
      code: "MAO",
      latitude: 15.2736,
      longitude: 73.9742,
      rating: 4.2,
      reviewsCount: 11200,
      distanceToCenterKm: 33,
      typicalTransferMinutes: 40,
      estimatedTransferCostInr: 550,
      description: "Major Konkan Railway junction connecting Goa with Mumbai, Delhi, and Bangalore.",
      operatingHours: "24 Hours",
      facilities: ["IRCTC Executive Lounge", "Prepaid Taxi Stand", "Cloak Room"],
    },
    {
      id: "hub-goa-taxi-panaji",
      destinationId: "dest-goa",
      name: "Panaji Central Tourist Taxi Stand & GoaMiles Hub",
      type: "taxi",
      latitude: 15.4989,
      longitude: 73.8278,
      rating: 4.5,
      reviewsCount: 4320,
      distanceToCenterKm: 2,
      typicalTransferMinutes: 5,
      estimatedTransferCostInr: 150,
      vehicleType: "GoaMiles App Cab / Tourist Taxi",
      operatingHours: "06:00 - 23:30",
      description: "Authorized taxi pickup stand next to Mandovi River promenade with fixed regulated rates.",
      facilities: ["App Pickup", "AC Sedans", "Rent-a-Scooter Nearby"],
    },
  ],

  // 2. Jaipur
  "dest-jaipur": [
    {
      id: "hub-jaipur-airport",
      destinationId: "dest-jaipur",
      name: "Jaipur International Airport (JAI)",
      type: "airport",
      code: "JAI",
      latitude: 26.8286,
      longitude: 75.8056,
      rating: 4.5,
      reviewsCount: 15600,
      distanceToCenterKm: 12,
      typicalTransferMinutes: 28,
      estimatedTransferCostInr: 450,
      description: "Sanganer airport with direct international flights and Ola/Uber dedicated pickup bays.",
      operatingHours: "24 Hours",
      facilities: ["Prepaid Taxi Booth", "App Cab Lounge", "Souvenirs"],
    },
    {
      id: "hub-jaipur-railway",
      destinationId: "dest-jaipur",
      name: "Jaipur Junction Railway Station (JP)",
      type: "railway",
      code: "JP",
      latitude: 26.9208,
      longitude: 75.7878,
      rating: 4.3,
      reviewsCount: 19800,
      distanceToCenterKm: 3,
      typicalTransferMinutes: 12,
      estimatedTransferCostInr: 120,
      description: "Heritage city junction connecting Vande Bharat and Palace on Wheels royal expresses.",
      operatingHours: "24 Hours",
      facilities: ["Metro Connectivity", "Prepaid Auto Stand", "Tourist Helpdesk"],
    },
    {
      id: "hub-jaipur-taxi",
      destinationId: "dest-jaipur",
      name: "Sindhi Camp Central Taxi & Auto Stand",
      type: "taxi",
      latitude: 26.922,
      longitude: 75.795,
      rating: 4.2,
      reviewsCount: 3100,
      distanceToCenterKm: 1.5,
      typicalTransferMinutes: 8,
      estimatedTransferCostInr: 90,
      vehicleType: "Prepaid Auto & AC Sedan",
      operatingHours: "24 Hours",
      description: "Central multimodal hub for Rajasthan intercity cabs, sightseeing drivers, and autos.",
      facilities: ["Fixed Meter Auto", "Day Tour Cabs", "Luggage Assistance"],
    },
  ],

  // 3. Delhi
  "dest-delhi": [
    {
      id: "hub-delhi-airport",
      destinationId: "dest-delhi",
      name: "Indira Gandhi International Airport Terminal 3 (DEL)",
      type: "airport",
      code: "DEL",
      latitude: 28.5562,
      longitude: 77.1,
      rating: 4.7,
      reviewsCount: 48900,
      distanceToCenterKm: 16,
      typicalTransferMinutes: 40,
      estimatedTransferCostInr: 550,
      description: "World-class aviation hub connected directly via Delhi Metro Airport Express & 24/7 Cabs.",
      operatingHours: "24 Hours",
      facilities: ["Airport Express Metro", "Prepaid Taxi", "24/7 Lounges"],
    },
    {
      id: "hub-delhi-railway",
      destinationId: "dest-delhi",
      name: "New Delhi Railway Station (NDLS)",
      type: "railway",
      code: "NDLS",
      latitude: 28.643,
      longitude: 77.2194,
      rating: 4.1,
      reviewsCount: 32400,
      distanceToCenterKm: 2,
      typicalTransferMinutes: 10,
      estimatedTransferCostInr: 140,
      description: "India's highest-volume railway station directly adjacent to Connaught Place and Yellow Line.",
      operatingHours: "24 Hours",
      facilities: ["IRCTC Lounge", "Direct Metro Footbridge", "Prepaid Booths"],
    },
    {
      id: "hub-delhi-taxi",
      destinationId: "dest-delhi",
      name: "Connaught Place Inner Circle Taxi & Auto Stand",
      type: "taxi",
      latitude: 28.6315,
      longitude: 77.2167,
      rating: 4.4,
      reviewsCount: 6100,
      distanceToCenterKm: 0.5,
      typicalTransferMinutes: 5,
      estimatedTransferCostInr: 80,
      vehicleType: "Delhi Traffic Police Prepaid Cab / Auto",
      operatingHours: "06:00 - 01:00",
      description: "Regulated central Delhi taxi bay with verified drivers and instant dispatch.",
      facilities: ["Prepaid Police Counter", "E-Rickshaws", "App Cab Priority Bay"],
    },
  ],

  // 4. Mumbai
  "dest-mumbai": [
    {
      id: "hub-mumbai-airport",
      destinationId: "dest-mumbai",
      name: "Chhatrapati Shivaji Maharaj International Airport T2 (BOM)",
      type: "airport",
      code: "BOM",
      latitude: 19.0896,
      longitude: 72.8656,
      rating: 4.7,
      reviewsCount: 42100,
      distanceToCenterKm: 20,
      typicalTransferMinutes: 50,
      estimatedTransferCostInr: 650,
      description: "Architectural masterpiece airport featuring the Jaya He India GVK museum and dedicated app cab decks.",
      operatingHours: "24 Hours",
      facilities: ["Ola/Uber Dedicated Decks", "Cool Cabs", "Metro Line 3 Access"],
    },
    {
      id: "hub-mumbai-railway",
      destinationId: "dest-mumbai",
      name: "Chhatrapati Shivaji Maharaj Terminus (CSMT)",
      type: "railway",
      code: "CSMT",
      latitude: 18.94,
      longitude: 72.8353,
      rating: 4.6,
      reviewsCount: 37800,
      distanceToCenterKm: 1.5,
      typicalTransferMinutes: 8,
      estimatedTransferCostInr: 70,
      description: "UNESCO World Heritage Victorian Gothic terminus in South Mumbai.",
      operatingHours: "24 Hours",
      facilities: ["Heritage Museum", "Kaali Peeli Taxi Stand", "Fast Suburban Trains"],
    },
    {
      id: "hub-mumbai-taxi",
      destinationId: "dest-mumbai",
      name: "Gateway of India / Colaba Kaali Peeli Taxi Stand",
      type: "taxi",
      latitude: 18.922,
      longitude: 72.8347,
      rating: 4.5,
      reviewsCount: 8900,
      distanceToCenterKm: 1,
      typicalTransferMinutes: 5,
      estimatedTransferCostInr: 50,
      vehicleType: "Metered Kaali Peeli / App Sedan",
      operatingHours: "24 Hours",
      description: "Iconic South Bombay cab stand operating strictly by official meter tariff cards.",
      facilities: ["Strict Meter Taxi", "Harbor Ferry Access", "Tourist Info"],
    },
  ],

  // 5. Darjeeling
  "dest-darjeeling": [
    {
      id: "hub-darjeeling-airport",
      destinationId: "dest-darjeeling",
      name: "Bagdogra International Airport (IXB)",
      type: "airport",
      code: "IXB",
      latitude: 26.6812,
      longitude: 88.3286,
      rating: 4.2,
      reviewsCount: 9700,
      distanceToCenterKm: 68,
      typicalTransferMinutes: 160,
      estimatedTransferCostInr: 2400,
      description: "Himalayan gateway airport at the foothills; connects Darjeeling, Kalimpong, and Sikkim.",
      operatingHours: "07:00 - 21:00",
      facilities: ["Prepaid Hill Taxi Syndicate", "Shared Cabs", "Tea Lounge"],
    },
    {
      id: "hub-darjeeling-railway",
      destinationId: "dest-darjeeling",
      name: "Darjeeling Himalayan Railway Station (DJ)",
      type: "railway",
      code: "DJ",
      latitude: 27.0428,
      longitude: 88.2642,
      rating: 4.8,
      reviewsCount: 14300,
      distanceToCenterKm: 0.5,
      typicalTransferMinutes: 5,
      estimatedTransferCostInr: 100,
      description: "UNESCO World Heritage DHR Toy Train station famous for steam joyrides to Batasia Loop & Ghum.",
      operatingHours: "08:00 - 18:00",
      facilities: ["DHR Steam Museum", "Joyride Ticket Booth", "Mall Road Pathway"],
    },
    {
      id: "hub-darjeeling-taxi",
      destinationId: "dest-darjeeling",
      name: "Chowrasta Mall Road Syndicate Taxi Stand",
      type: "taxi",
      latitude: 27.0435,
      longitude: 88.2655,
      rating: 4.3,
      reviewsCount: 2900,
      distanceToCenterKm: 0.2,
      typicalTransferMinutes: 3,
      estimatedTransferCostInr: 120,
      vehicleType: "Hill 4WD (Bolero / Innova)",
      operatingHours: "06:00 - 20:00",
      description: "Authorized Darjeeling Drivers Association stand for Tiger Hill sunrise and local sight tours.",
      facilities: ["Fixed Rate Sightseeing", "Tiger Hill Bookings", "Shared Jeeps"],
    },
  ],

  // 6. Kolkata
  "dest-kolkata": [
    {
      id: "hub-kolkata-airport",
      destinationId: "dest-kolkata",
      name: "Netaji Subhash Chandra Bose International Airport (CCU)",
      type: "airport",
      code: "CCU",
      latitude: 22.6547,
      longitude: 88.4467,
      rating: 4.5,
      reviewsCount: 27800,
      distanceToCenterKm: 15,
      typicalTransferMinutes: 40,
      estimatedTransferCostInr: 420,
      description: "Modern integrated terminal with Rabindranath Tagore calligraphy motifs and AC buses.",
      operatingHours: "24 Hours",
      facilities: ["Yellow Taxi Prepaid", "App Cab Lanes", "WBTC AC Volvo Buses"],
    },
    {
      id: "hub-kolkata-railway",
      destinationId: "dest-kolkata",
      name: "Howrah Junction Railway Station (HWH)",
      type: "railway",
      code: "HWH",
      latitude: 22.5855,
      longitude: 88.3433,
      rating: 4.3,
      reviewsCount: 45600,
      distanceToCenterKm: 4,
      typicalTransferMinutes: 20,
      estimatedTransferCostInr: 180,
      description: "Largest and oldest railway station complex in India, connected via the Howrah Bridge and underwater metro.",
      operatingHours: "24 Hours",
      facilities: ["Underwater Green Metro", "Ferry Ghat to Fairlie", "Prepaid Taxi Line"],
    },
    {
      id: "hub-kolkata-taxi",
      destinationId: "dest-kolkata",
      name: "Esplanade Central Yellow Taxi & App Cab Hub",
      type: "taxi",
      latitude: 22.5645,
      longitude: 88.3518,
      rating: 4.2,
      reviewsCount: 5200,
      distanceToCenterKm: 1,
      typicalTransferMinutes: 6,
      estimatedTransferCostInr: 70,
      vehicleType: "Classic Ambassador Yellow Taxi & AC Sedans",
      operatingHours: "24 Hours",
      description: "Heart of central Kolkata near New Market, Indian Museum, and Maidan.",
      facilities: ["Metered Yellow Cabs", "Metro Junction", "Tram Depot"],
    },
  ],

  // 7. Bengaluru
  "dest-bengaluru": [
    {
      id: "hub-bengaluru-airport",
      destinationId: "dest-bengaluru",
      name: "Kempegowda International Airport Terminal 2 (BLR)",
      type: "airport",
      code: "BLR",
      latitude: 13.1986,
      longitude: 77.7066,
      rating: 4.8,
      reviewsCount: 38900,
      distanceToCenterKm: 32,
      typicalTransferMinutes: 55,
      estimatedTransferCostInr: 900,
      description: "Award-winning 'Terminal in a Garden' with Vayu Vajra Volvo electric buses and premium app lounges.",
      operatingHours: "24 Hours",
      facilities: ["Vayu Vajra AC Bus", "Mega App Cab Zones", "Bamboo Garden"],
    },
    {
      id: "hub-bengaluru-railway",
      destinationId: "dest-bengaluru",
      name: "KSR Bengaluru City Railway Station (SBC)",
      type: "railway",
      code: "SBC",
      latitude: 12.9781,
      longitude: 77.5696,
      rating: 4.4,
      reviewsCount: 24500,
      distanceToCenterKm: 3.5,
      typicalTransferMinutes: 15,
      estimatedTransferCostInr: 130,
      description: "Majestic junction with direct skywalk to Krantivira Sangolli Rayanna Metro station.",
      operatingHours: "24 Hours",
      facilities: ["Namma Metro Skywalk", "Prepaid Auto Kiosk", "IRCTC Lounge"],
    },
    {
      id: "hub-bengaluru-taxi",
      destinationId: "dest-bengaluru",
      name: "MG Road & Church Street Prepaid Cab Zone",
      type: "taxi",
      latitude: 12.9756,
      longitude: 77.6066,
      rating: 4.5,
      reviewsCount: 7100,
      distanceToCenterKm: 0.8,
      typicalTransferMinutes: 5,
      estimatedTransferCostInr: 80,
      vehicleType: "Auto-rickshaw / Electric Cab / Sedan",
      operatingHours: "24 Hours",
      description: "Prime CBD cab hub with rapid app matching and dedicated traffic police kiosk.",
      facilities: ["Fast Cab Pickup", "Metro Purple Line", "E-Auto Chargers"],
    },
  ],

  // 8. Manali
  "dest-manali": [
    {
      id: "hub-manali-airport",
      destinationId: "dest-manali",
      name: "Kullu-Manali Airport, Bhuntar (KUU)",
      type: "airport",
      code: "KUU",
      latitude: 31.8763,
      longitude: 77.1541,
      rating: 4.3,
      reviewsCount: 4200,
      distanceToCenterKm: 50,
      typicalTransferMinutes: 85,
      estimatedTransferCostInr: 1750,
      description: "Scenic Beas valley airstrip serving Kullu and Manali mountain adventures.",
      operatingHours: "08:00 - 16:00",
      facilities: ["Prepaid Cab Counter", "Himachal Tourism Desk"],
    },
    {
      id: "hub-manali-railway",
      destinationId: "dest-manali",
      name: "Joginder Nagar Narrow Gauge Railway Station (JDNX)",
      type: "railway",
      code: "JDNX",
      latitude: 31.9839,
      longitude: 76.7725,
      rating: 4.1,
      reviewsCount: 1800,
      distanceToCenterKm: 95,
      typicalTransferMinutes: 180,
      estimatedTransferCostInr: 2800,
      description: "Nearest historic Kangra Valley Toy Train terminus before high-altitude road transit.",
      operatingHours: "07:00 - 19:00",
      facilities: ["Mountain Cabs", "Scenic Viewpoint"],
    },
    {
      id: "hub-manali-taxi",
      destinationId: "dest-manali",
      name: "Manali Mall Road Taxi Operators Union Stand",
      type: "taxi",
      latitude: 32.2396,
      longitude: 77.1887,
      rating: 4.5,
      reviewsCount: 5400,
      distanceToCenterKm: 0.2,
      typicalTransferMinutes: 3,
      estimatedTransferCostInr: 150,
      vehicleType: "Himachal Registered 4x4 & SUV",
      operatingHours: "06:00 - 22:00",
      description: "Official union stand for Solang Valley, Atal Tunnel, Rohtang Pass, and Sissu day excursions.",
      facilities: ["Rohtang Permit Verification", "4x4 Snow Cabs", "Fixed Rates"],
    },
  ],
};

/**
 * Procedural fallback for any destination not explicitly listed in predefined dictionary.
 */
function generateProceduralTransitHubs(
  destinationId: string,
  destinationName: string,
  lat: number,
  lng: number
): TransitHub[] {
  const cleanName = destinationName || "Destination";
  return [
    {
      id: `hub-${destinationId}-airport`,
      destinationId,
      name: `${cleanName} Regional Airport`,
      type: "airport",
      code: cleanName.substring(0, 3).toUpperCase(),
      latitude: lat + 0.08,
      longitude: lng + 0.06,
      rating: 4.4,
      reviewsCount: 3200,
      distanceToCenterKm: 14.2,
      typicalTransferMinutes: 32,
      estimatedTransferCostInr: 450,
      description: `Primary civil aviation gateway serving ${cleanName} and surrounding regions.`,
      operatingHours: "24 Hours",
      facilities: ["Prepaid Cab Counter", "Luggage Assistance", "Cafeteria"],
    },
    {
      id: `hub-${destinationId}-railway`,
      destinationId,
      name: `${cleanName} Central Railway Junction`,
      type: "railway",
      code: cleanName.substring(0, 4).toUpperCase(),
      latitude: lat - 0.02,
      longitude: lng - 0.025,
      rating: 4.2,
      reviewsCount: 8400,
      distanceToCenterKm: 3.5,
      typicalTransferMinutes: 12,
      estimatedTransferCostInr: 120,
      description: `Principal rail terminus connecting ${cleanName} with national express lines.`,
      operatingHours: "24 Hours",
      facilities: ["Prepaid Auto Stand", "Tourist Help Desk", "Waiting Lounge"],
    },
    {
      id: `hub-${destinationId}-taxi`,
      destinationId,
      name: `${cleanName} City Center Prepaid Taxi & Cab Stand`,
      type: "taxi",
      latitude: lat + 0.008,
      longitude: lng + 0.005,
      rating: 4.4,
      reviewsCount: 2100,
      distanceToCenterKm: 0.8,
      typicalTransferMinutes: 4,
      estimatedTransferCostInr: 60,
      vehicleType: "Regulated City Taxi / Auto",
      operatingHours: "06:00 - 23:00",
      description: `Central verified transport stand for local city exploration and day trips.`,
      facilities: ["Verified Drivers", "Fixed Fares", "Instant Dispatch"],
    },
  ];
}

/**
 * Retrieve Transit Hubs (Airports, Railway Stations, Taxi Pickup Stands)
 * for a destination.
 */
export function getDestinationTransitHubs(
  destinationIdOrName: string,
  fallbackLat?: number,
  fallbackLng?: number,
  destinationName?: string
): TransitHub[] {
  if (!destinationIdOrName) return [];

  const normalizedKey = destinationIdOrName.toLowerCase().trim();

  // Try direct key or matching key
  for (const [key, hubs] of Object.entries(DESTINATION_TRANSIT_HUBS)) {
    if (
      key === normalizedKey ||
      key.includes(normalizedKey) ||
      normalizedKey.includes(key.replace("dest-", ""))
    ) {
      return hubs;
    }
  }

  // Also check if destinationName matches
  if (destinationName) {
    const nameKey = destinationName.toLowerCase().trim();
    for (const [key, hubs] of Object.entries(DESTINATION_TRANSIT_HUBS)) {
      if (key.includes(nameKey) || nameKey.includes(key.replace("dest-", ""))) {
        return hubs;
      }
    }
  }

  // Generate sensible procedural hubs around coordinates if provided
  if (fallbackLat !== undefined && fallbackLng !== undefined) {
    return generateProceduralTransitHubs(
      destinationIdOrName,
      destinationName || "Destination",
      fallbackLat,
      fallbackLng
    );
  }

  return [];
}
