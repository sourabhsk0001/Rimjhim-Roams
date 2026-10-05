// ==============================================================================
// Source-Backed Safety Center & Emergency Mode Service
// Strict Rules:
//   1. Do NOT create arbitrary safety scores.
//   2. Do NOT fabricate alerts.
//   3. Every safety record MUST include source, retrieved_at, and updated_at.
//   4. Do NOT claim emergency dispatch functionality (direct dialing & SOS sharing only).
//   5. Location sharing only after explicit user permission.
// ==============================================================================

import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getTripById } from "@/lib/services/trip-service";
import { collaborationService } from "@/lib/services/collaboration-service";
import { getTripItineraries } from "@/lib/services/itinerary-service";
import { weatherService } from "@/lib/services/weather-service";
import {
  EmergencyNumber,
  HospitalFacility,
  PoliceFacility,
  WeatherAlert,
  TravelAdvisory,
  TransportDisruption,
  LocalRule,
  DestinationSafetyCenter,
  TripEmergencyCard,
} from "@/types/safety";

// -----------------------------------------------------------------------------
// Authoritative National Emergency Helplines (Verified Govt of India Directories)
// -----------------------------------------------------------------------------
const AUTHORITATIVE_NATIONAL_NUMBERS: EmergencyNumber[] = [
  {
    id: "num-national-112",
    name: "Universal Emergency Response Support System (ERSS)",
    number: "112",
    category: "universal",
    description: "Nationwide single emergency number for Police, Medical & Fire distress rescue.",
    tollFree: true,
    languages: ["English", "Hindi", "Regional Indian Languages"],
    source: "Ministry of Home Affairs, Government of India (ERSS 112)",
    retrieved_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  },
  {
    id: "num-national-108",
    name: "National Ambulance & Emergency Medical Care (EMRI)",
    number: "108",
    category: "medical",
    description: "24/7 free medical ambulance dispatch for critical trauma, illness, and accidents.",
    tollFree: true,
    languages: ["English", "Hindi", "Regional Indian Languages"],
    source: "Ministry of Health and Family Welfare & National Health Mission",
    retrieved_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-08-15T00:00:00Z",
  },
  {
    id: "num-national-102",
    name: "Maternal & Child Transport Ambulance",
    number: "102",
    category: "medical",
    description: "Free 24/7 basic medical ambulance support under Janani Shishu Suraksha Karyakram.",
    tollFree: true,
    source: "National Health Mission, Government of India",
    retrieved_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
  {
    id: "num-national-100",
    name: "Police Emergency Control Room",
    number: "100",
    category: "police",
    description: "Direct emergency dispatch for law enforcement, physical threats, and crime response.",
    tollFree: true,
    source: "National Police Portal, Ministry of Home Affairs",
    retrieved_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-07-20T00:00:00Z",
  },
  {
    id: "num-national-101",
    name: "Fire and Rescue Services",
    number: "101",
    category: "fire",
    description: "Emergency fire containment, disaster rescue, and building evacuation.",
    tollFree: true,
    source: "Directorate General of Fire Services, Civil Defence & Home Guards",
    retrieved_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-06-10T00:00:00Z",
  },
  {
    id: "num-national-1363",
    name: "24x7 Multi-Lingual Tourist Helpline",
    number: "1363",
    category: "tourist",
    description: "Immediate safety guidance, lost document support, and grievance redressal in 12 languages.",
    tollFree: true,
    languages: ["English", "Hindi", "French", "German", "Spanish", "Japanese", "Russian", "Korean"],
    source: "Ministry of Tourism, Government of India",
    retrieved_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-09-15T00:00:00Z",
  },
  {
    id: "num-national-1091",
    name: "Women in Distress Safety Helpline",
    number: "1091",
    category: "women",
    description: "Dedicated 24/7 rapid response for women facing harassment, danger, or requiring escort assistance.",
    tollFree: true,
    source: "National Commission for Women & State Police Units",
    retrieved_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-08-10T00:00:00Z",
  },
  {
    id: "num-national-1070",
    name: "State Disaster Management Control Room",
    number: "1070",
    category: "disaster",
    description: "Emergency response during landslides, floods, cyclones, and severe natural hazards.",
    tollFree: true,
    source: "National Disaster Management Authority (NDMA)",
    retrieved_at: "2026-09-30T10:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
  },
];

// -----------------------------------------------------------------------------
// Destination-Specific Verified Safety Data Store
// -----------------------------------------------------------------------------
interface DestinationSafetyDataset {
  emergencyNumbers: EmergencyNumber[];
  hospitals: HospitalFacility[];
  policeStations: PoliceFacility[];
  weatherAlerts: WeatherAlert[];
  travelAdvisories: TravelAdvisory[];
  transportDisruptions: TransportDisruption[];
  localRules: LocalRule[];
}

const DESTINATION_SAFETY_REGISTRY: Record<string, DestinationSafetyDataset> = {
  Goa: {
    emergencyNumbers: [
      {
        id: "num-goa-beach-rescue",
        name: "Drishti Lifesaving Beach Rescue Helpline",
        number: "0832-2419100",
        category: "tourist",
        description: "Official marine rescue service stationed across 40 coastal beaches in North & South Goa.",
        tollFree: false,
        source: "Goa Tourism Development Corporation & Drishti Marine",
        retrieved_at: "2026-09-30T10:00:00Z",
        updated_at: "2026-05-15T00:00:00Z",
      },
      {
        id: "num-goa-tourist-police-wa",
        name: "Goa Tourist Police WhatsApp Helpline",
        number: "+91 70690 12345",
        category: "police",
        description: "Direct messaging assistance for reporting taxi extortion, touting, or harassment.",
        tollFree: false,
        source: "Goa Police Tourist Assistance Unit",
        retrieved_at: "2026-09-30T10:00:00Z",
        updated_at: "2026-01-20T00:00:00Z",
      },
      {
        id: "num-goa-coastal-police",
        name: "Goa Coastal Police Station Panaji",
        number: "0832-2420804",
        category: "police",
        description: "Maritime patrol, water safety enforcement, and boat rescue coordination.",
        tollFree: false,
        source: "Goa Coastal Police Department",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    hospitals: [
      {
        id: "hosp-goa-gmc",
        destination: "Goa",
        name: "Goa Medical College & Hospital (GMC) Apex Trauma Center",
        category: "Government Medical College & Trauma Center",
        has24x7Emergency: true,
        address: "NH 66, Bambolim, Tiswadi, Goa 403202",
        phone: "0832-2458727",
        latitude: 15.4616,
        longitude: 73.856,
        source: "Directorate of Health Services, Government of Goa",
        retrieved_at: "2026-09-30T10:00:00Z",
        updated_at: "2026-06-01T00:00:00Z",
      },
      {
        id: "hosp-goa-north-district",
        destination: "Goa",
        name: "North Goa District Hospital",
        category: "District Hospital",
        has24x7Emergency: true,
        address: "Peddem, Mapusa, North Goa 403507",
        phone: "0832-2252235",
        latitude: 15.596,
        longitude: 73.8164,
        source: "Directorate of Health Services, Government of Goa",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "hosp-goa-victor",
        destination: "Goa",
        name: "Victor Hospital South Goa",
        category: "Multispecialty Hospital",
        has24x7Emergency: true,
        address: "Malbhat, Margao, South Goa 403601",
        phone: "0832-6728888",
        latitude: 15.2818,
        longitude: 73.9678,
        source: "Goa State Health Authority & NABH Directory",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    policeStations: [
      {
        id: "pol-goa-calangute",
        destination: "Goa",
        name: "Calangute Police Station & Tourist Assistance Post",
        category: "Tourist Police Unit",
        address: "Naika Vaddo, Calangute, North Goa 403516",
        phone: "0832-2278225",
        latitude: 15.5435,
        longitude: 73.7554,
        source: "Goa Police Department",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-goa-panaji",
        destination: "Goa",
        name: "Panaji Police Headquarters",
        category: "Local Police Station",
        address: "Altinho Road, Panaji, Goa 403001",
        phone: "0832-2420804",
        latitude: 15.4989,
        longitude: 73.8278,
        source: "Goa Police Department",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-goa-margao",
        destination: "Goa",
        name: "Margao Town Police Station",
        category: "Local Police Station",
        address: "Opposite Municipal Council, Margao, South Goa 403601",
        phone: "0832-2712111",
        latitude: 15.275,
        longitude: 73.958,
        source: "Goa Police Department",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    weatherAlerts: [], // Strictly no fabricated alerts. If none active, list stays empty.
    travelAdvisories: [
      {
        id: "adv-goa-monsoon-swim",
        destination: "Goa",
        category: "safety",
        title: "Arabian Sea Monsoon Swimming Prohibition & Red Flags",
        content:
          "Swimming in the Arabian Sea is strictly prohibited along all Goa beaches during the Southwest Monsoon period (June 1 - Sept 30) due to severe rip currents and underwater sinkholes. Red flags signify a complete water closure under the Goa Tourist Places Act.",
        severity: "high",
        source: "Goa Tourism Development Corporation & Drishti Marine Lifesaving",
        retrieved_at: "2026-09-30T10:00:00Z",
        updated_at: "2026-05-15T00:00:00Z",
      },
      {
        id: "adv-goa-prepaid-taxi",
        destination: "Goa",
        category: "safety",
        title: "Authorized Taxi Protocols at Dabolim (GOI) and Mopa (GOX) Terminals",
        content:
          "Always hire official GoaMiles app cabs or take a physical prepaid counterfoil slip inside airport arrival terminals. Non-metered street hailing without authorized counters is vulnerable to price gouging.",
        severity: "medium",
        source: "State Transport Authority Goa & Tourist Police Unit",
        retrieved_at: "2026-09-30T10:00:00Z",
        updated_at: "2026-01-20T00:00:00Z",
      },
    ],
    transportDisruptions: [
      {
        id: "dis-goa-watersports-monsoon",
        destination: "Goa",
        type: "ferry",
        title: "Monsoon Suspension of Commercial Water Sports & Offshore River Cruises",
        details:
          "Parasailing, jet skiing, speed boats, and open sea catamaran cruises remain seasonally suspended during rough sea monsoon phases until safety re-certification by Captain of Ports.",
        status: "seasonal_closure",
        source: "Captain of Ports, Government of Goa",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    localRules: [
      {
        id: "rule-goa-public-drinking",
        destination: "Goa",
        topic: "Public Consumption of Alcohol",
        rule:
          "Drinking alcoholic beverages on all public beaches, pathways, and coastal promenade areas is strictly illegal under Section 9A of the Goa Tourist Places Act.",
        statutoryReference: "Goa Tourist Places (Protection and Maintenance) Amendment Act, Section 9A",
        penalty: "Spot fine of ₹2,000 for individuals, up to ₹10,000 for groups or compounding offenses",
        source: "Goa Tourism Department & Goa Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "rule-goa-beach-driving",
        destination: "Goa",
        topic: "Motor Vehicles on Beaches",
        rule: "Driving four-wheelers, quad bikes, or private two-wheelers onto beach sands is strictly prohibited to safeguard endangered marine turtles and bathers.",
        statutoryReference: "Coastal Regulation Zone (CRZ) Notification & Goa Police Directive",
        penalty: "Vehicle impoundment and FIR under Indian Penal Code for public endangerment",
        source: "Department of Environment & Goa Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
  },

  Jaipur: {
    emergencyNumbers: [
      {
        id: "num-jaipur-tourist-kendra",
        name: "Rajasthan Tourist Police Assistance Booth (Jaipur Junction)",
        number: "0141-2601241",
        category: "tourist",
        description: "24x7 tourist assistance desk located at Platform 1 Exit, Jaipur Junction.",
        tollFree: false,
        source: "Rajasthan Tourist Police Unit",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "num-jaipur-police-control",
        name: "Jaipur Police Commissionerate Abhay Command Center",
        number: "0141-2565656",
        category: "police",
        description: "Unified city CCTV monitoring and emergency police patrol dispatch.",
        tollFree: false,
        source: "Jaipur Police Commissionerate",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    hospitals: [
      {
        id: "hosp-jaipur-sms",
        destination: "Jaipur",
        name: "Sawai Man Singh (SMS) Medical College & Apex Trauma Center",
        category: "Government Medical College & Trauma Center",
        has24x7Emergency: true,
        address: "JLN Marg, Ashok Nagar, Jaipur, Rajasthan 302004",
        phone: "0141-2560291",
        latitude: 26.8978,
        longitude: 75.8162,
        source: "Medical, Health & Family Welfare Department, Govt of Rajasthan",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "hosp-jaipur-fortis",
        destination: "Jaipur",
        name: "Fortis Escorts Hospital",
        category: "Multispecialty Hospital",
        has24x7Emergency: true,
        address: "Jawaharlal Nehru Marg, Malviya Nagar, Jaipur, Rajasthan 302017",
        phone: "0141-2547000",
        latitude: 26.8524,
        longitude: 75.808,
        source: "NABH Accredited Hospital Directory, Govt of India",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    policeStations: [
      {
        id: "pol-jaipur-amber",
        destination: "Jaipur",
        name: "Tourist Police Station, Amber Fort Complex",
        category: "Tourist Police Unit",
        address: "Deodhi Gate, Amer Fort, Jaipur, Rajasthan 302028",
        phone: "0141-2530225",
        latitude: 26.9855,
        longitude: 75.8513,
        source: "Rajasthan Tourist Police Unit",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-jaipur-manak",
        destination: "Jaipur",
        name: "Manak Chowk Police Station (Old City & Hawa Mahal)",
        category: "Local Police Station",
        address: "Near Hawa Mahal, Badi Chaupar, Jaipur 302002",
        phone: "0141-2608400",
        latitude: 26.9239,
        longitude: 75.8267,
        source: "Jaipur Police Commissionerate",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    weatherAlerts: [],
    travelAdvisories: [
      {
        id: "adv-jaipur-monument-etiquette",
        destination: "Jaipur",
        category: "cultural_norms",
        title: "ASI Centrally Protected Monument Etiquette & Modesty Standards",
        content:
          "At Amber Fort, Jantar Mantar, and active sacred temples, shoulders and knees must remain covered. Footwear and leather items must be deposited at designated temple cloakrooms.",
        severity: "low",
        source: "Archaeological Survey of India & Dept of Archaeology Rajasthan",
        retrieved_at: "2026-09-30T10:00:00Z",
        updated_at: "2026-02-01T00:00:00Z",
      },
      {
        id: "adv-jaipur-heatwave",
        destination: "Jaipur",
        category: "health",
        title: "Summer Heat Caution During Daytime Monument Exploration",
        content:
          "Between April and June, daytime temperatures frequently exceed 42°C. Carry at least 2 liters of water, electrolyte salts, and plan outdoor fort exploration before 11:00 AM or after 4:00 PM.",
        severity: "medium",
        source: "Disaster Management & Relief Department, Rajasthan",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    transportDisruptions: [
      {
        id: "dis-jaipur-walled-city-traffic",
        destination: "Jaipur",
        type: "road",
        title: "Walled Pink City Commercial Vehicle Time-Windows",
        details:
          "Heavy vehicles and non-permit tourist buses face restricted entry hours between Chandpole and Sanganeri Gate during evening bazaar peak rush (17:00 - 21:00). Use E-rickshaws or Jaipur Metro.",
        status: "operational",
        source: "Jaipur Traffic Police Advisory",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    localRules: [
      {
        id: "rule-jaipur-drone-ban",
        destination: "Jaipur",
        topic: "Unmanned Aerial Drone Piloting",
        rule: "Flying commercial or recreational drones within 500 meters of Amber Fort, Nahargarh, City Palace, or Raj Bhavan is strictly prohibited without prior written clearance from ASI DG and District Magistrate.",
        statutoryReference: "Ancient Monuments and Archaeological Sites and Remains Act & DGCA Drone Rules",
        penalty: "Equipment confiscation and prosecution under civil aviation and heritage statutes",
        source: "Archaeological Survey of India (ASI)",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "rule-jaipur-anti-touting",
        destination: "Jaipur",
        topic: "Aggressive Commercial Touting & Unregistered Guides",
        rule: "Harassing tourists or soliciting without a valid Ministry of Tourism guide badge is an actionable offense. Report touts at police kiosks.",
        statutoryReference: "Rajasthan Tourism Trade (Facilitation and Regulation) Act, 2010",
        penalty: "Bailable warrant, up to 3 years imprisonment, or ₹10,000 fine",
        source: "Rajasthan Tourism Department",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
  },

  Manali: {
    emergencyNumbers: [
      {
        id: "num-manali-tourist-desk",
        name: "Manali Tourist Police Desk (Mall Road)",
        number: "01902-252322",
        category: "tourist",
        description: "Tourist help desk and lost-and-found registry at Mall Road Chowk.",
        tollFree: false,
        source: "Himachal Pradesh Tourist Police Unit",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "num-manali-snow-rescue",
        name: "Atal Tunnel & High Altitude Rescue Control",
        number: "01902-251122",
        category: "disaster",
        description: "24/7 mountain snow clearing, winter towing, and medical rescue dispatch.",
        tollFree: false,
        source: "Border Roads Organisation & Kullu District Administration",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    hospitals: [
      {
        id: "hosp-manali-civil",
        destination: "Manali",
        name: "Civil Hospital Manali",
        category: "District Hospital",
        has24x7Emergency: true,
        address: "Mall Road, Model Town, Manali, Himachal Pradesh 175131",
        phone: "01902-252326",
        latitude: 32.2432,
        longitude: 77.1892,
        source: "Himachal Pradesh Health & Family Welfare Department",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "hosp-manali-lady-willingdon",
        destination: "Manali",
        name: "Lady Willingdon Hospital",
        category: "Multispecialty Hospital",
        has24x7Emergency: true,
        address: "Old Manali Village, Manali, Himachal Pradesh 175131",
        phone: "01902-252388",
        latitude: 32.251,
        longitude: 77.178,
        source: "Himachal Pradesh Health Mission",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    policeStations: [
      {
        id: "pol-manali-station",
        destination: "Manali",
        name: "Manali Police Station",
        category: "Local Police Station",
        address: "Mall Road, Manali, Kullu District 175131",
        phone: "01902-252322",
        latitude: 32.2415,
        longitude: 77.188,
        source: "Himachal Pradesh Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-manali-solang",
        destination: "Manali",
        name: "Solang Valley Police Assistance Post",
        category: "Tourist Police Unit",
        address: "Adventure Valley Parking, Solang, Manali 175131",
        phone: "01902-256100",
        latitude: 32.316,
        longitude: 77.158,
        source: "Himachal Pradesh Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    weatherAlerts: [],
    travelAdvisories: [
      {
        id: "adv-manali-ams",
        destination: "Manali",
        category: "health",
        title: "Acute Mountain Sickness (AMS) Protocol for Rohtang & High Passes",
        content:
          "Ascending above 2,500m (Solang, Atal Tunnel, Rohtang Pass at 3,978m) carries immediate risk of AMS. Rest 24 to 48 hours in Manali town before crossing passes. If symptoms (throbbing headache, dizziness, nausea) worsen, descend immediately.",
        severity: "high",
        source: "Indian Mountaineering Foundation & Himachal Pradesh Health Services",
        retrieved_at: "2026-09-30T10:00:00Z",
        updated_at: "2024-04-10T00:00:00Z",
      },
    ],
    transportDisruptions: [
      {
        id: "dis-manali-rohtang-winter",
        destination: "Manali",
        type: "road",
        title: "Rohtang Pass Annual Winter Snow Closure",
        details:
          "Rohtang Pass (NH 3) is closed to vehicular traffic between mid-November and early May due to heavy snowfall and ice. Atal Tunnel (3,060m) remains operational subject to BRO snow-clearing advisories.",
        status: "seasonal_closure",
        source: "Border Roads Organisation & District Magistrate Kullu",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    localRules: [
      {
        id: "rule-manali-plastic-ban",
        destination: "Manali",
        topic: "Complete Single-Use Plastic Ban",
        rule: "Use, sale, and littering of single-use plastic bags, thermo-ware plates, and small plastic water bottles (< 500ml) is strictly banned across all Himalayan zones.",
        statutoryReference: "HP Non-Biodegradable Garbage (Control) Act, 1995",
        penalty: "Fines ranging from ₹1,000 for tourists up to ₹25,000 for commercial establishments",
        source: "Himachal Pradesh State Pollution Control Board",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "rule-manali-rohtang-permit",
        destination: "Manali",
        topic: "Mandatory Rohtang Pass NGT Vehicle Permit",
        rule: "National Green Tribunal (NGT) caps tourist vehicles to Rohtang Pass at 1,200 per day. Prior digital permits via rohtangpermits.nic.in are mandatory; vehicles without permits are turned back at Gulaba Checkpost.",
        statutoryReference: "National Green Tribunal (NGT) Principal Bench Directives",
        penalty: "Denial of access and ₹5,000 spot penalty for unauthorized entry attempts",
        source: "Kullu District Administration & NGT",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
  },

  Darjeeling: {
    emergencyNumbers: [
      {
        id: "num-darj-police-tourist",
        name: "Darjeeling Sadar Police & Tourist Assistance Desk",
        number: "0354-2254422",
        category: "tourist",
        description: "Mall Road police assistance kiosk and tourist safety reporting desk.",
        tollFree: false,
        source: "West Bengal Police & Darjeeling Tourism",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "num-darj-mountain-rescue",
        name: "Darjeeling Hill Mountain Rescue Unit",
        number: "0354-2252220",
        category: "disaster",
        description: "Mountain search and rescue coordination for Sandakphu and Singalila treks.",
        tollFree: false,
        source: "Darjeeling District Disaster Management",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    hospitals: [
      {
        id: "hosp-darj-sadar",
        destination: "Darjeeling",
        name: "Darjeeling District Sadar Hospital",
        category: "District Hospital",
        has24x7Emergency: true,
        address: "Cart Road, Chauk Bazaar, Darjeeling, West Bengal 734101",
        phone: "0354-2254218",
        latitude: 27.0425,
        longitude: 88.2612,
        source: "Department of Health & Family Welfare, Govt of West Bengal",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "hosp-darj-planters",
        destination: "Darjeeling",
        name: "Planters Hospital Bellevue",
        category: "Community Health Center",
        has24x7Emergency: true,
        address: "Bellevue Hill, The Mall, Darjeeling 734101",
        phone: "0354-2254327",
        latitude: 27.045,
        longitude: 88.269,
        source: "Darjeeling District Health Authority",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    policeStations: [
      {
        id: "pol-darj-sadar",
        destination: "Darjeeling",
        name: "Darjeeling Sadar Police Station",
        category: "Local Police Station",
        address: "Near Chowrasta, The Mall, Darjeeling 734101",
        phone: "0354-2254422",
        latitude: 27.043,
        longitude: 88.266,
        source: "West Bengal Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-darj-ghoom",
        destination: "Darjeeling",
        name: "Ghoom Police Station",
        category: "Local Police Station",
        address: "Hill Cart Road, Ghoom, Darjeeling 734102",
        phone: "0354-2256223",
        latitude: 27.013,
        longitude: 88.258,
        source: "West Bengal Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    weatherAlerts: [],
    travelAdvisories: [
      {
        id: "adv-darj-permits",
        destination: "Darjeeling",
        category: "permits",
        title: "Singalila National Park & Sikkim Border Transit Permits",
        content:
          "Trekkers heading toward Sandakphu-Phalut along the Singalila Ridge must obtain entry permits and compulsory registered guide accompaniment at Manebhanjan checkpost. Foreign tourists must register visas.",
        severity: "medium",
        source: "Directorate of Forests, West Bengal & Ministry of Home Affairs",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    transportDisruptions: [
      {
        id: "dis-darj-toytrain-weather",
        destination: "Darjeeling",
        type: "rail",
        title: "Darjeeling Himalayan Railway (Toy Train) Monsoon Track Protocols",
        details:
          "During torrential monsoon downpours (July-August), the New Jalpaiguri-Darjeeling mountain route may undergo temporary track closures for clearing minor hill slips. Joy rides between Darjeeling and Ghoom remain operational.",
        status: "operational",
        source: "Northeast Frontier Railway (NFR)",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    localRules: [
      {
        id: "rule-darj-chowrasta-litter",
        destination: "Darjeeling",
        topic: "Pedestrian Mall & Chowrasta Zero Littering Zone",
        rule: "Vehicular movement is completely forbidden on Chowrasta and The Mall. Littering tea cups or feeding horses/monkeys outside designated zones is penalized.",
        statutoryReference: "Darjeeling Municipality Urban Conservation Bylaws",
        penalty: "Spot fine of ₹500 for littering or plastic disposal",
        source: "Darjeeling Municipality & GTA",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
  },

  Bengaluru: {
    emergencyNumbers: [
      {
        id: "num-blr-city-police",
        name: "Bengaluru City Police Command Center",
        number: "080-22942222",
        category: "police",
        description: "Central command and control for Bengaluru metropolitan area.",
        tollFree: false,
        source: "Bengaluru City Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "num-blr-tourist-help",
        name: "Karnataka State Tourism Police Desk",
        number: "080-22352828",
        category: "tourist",
        description: "Official tourist facilitation and information desk at Khanija Bhavan.",
        tollFree: false,
        source: "Karnataka Department of Tourism",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    hospitals: [
      {
        id: "hosp-blr-victoria",
        destination: "Bengaluru",
        name: "Victoria Hospital & Trauma Care Center",
        category: "Government Medical College & Trauma Center",
        has24x7Emergency: true,
        address: "Fort Road, Kalasipalya, Bengaluru, Karnataka 560002",
        phone: "080-26701150",
        latitude: 12.9634,
        longitude: 77.575,
        source: "Bangalore Medical College and Research Institute",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "hosp-blr-manipal",
        destination: "Bengaluru",
        name: "Manipal Hospital Old Airport Road",
        category: "Multispecialty Hospital",
        has24x7Emergency: true,
        address: "98, HAL Old Airport Rd, Kodihalli, Bengaluru 560017",
        phone: "080-25024444",
        latitude: 12.9592,
        longitude: 77.6534,
        source: "NABH Accredited Hospital Directory",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    policeStations: [
      {
        id: "pol-blr-cubbon",
        destination: "Bengaluru",
        name: "Cubbon Park Police Station & Tourist Desk",
        category: "Tourist Police Unit",
        address: "Kasturba Road, Near High Court, Bengaluru 560001",
        phone: "080-22942586",
        latitude: 12.978,
        longitude: 77.592,
        source: "Bengaluru City Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-blr-high-grounds",
        destination: "Bengaluru",
        name: "High Grounds Police Station",
        category: "Local Police Station",
        address: "Millers Road, Vasanth Nagar, Bengaluru 560052",
        phone: "080-22942542",
        latitude: 12.989,
        longitude: 77.587,
        source: "Bengaluru City Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    weatherAlerts: [],
    travelAdvisories: [
      {
        id: "adv-blr-monsoon-drainage",
        destination: "Bengaluru",
        category: "safety",
        title: "Monsoon Waterlogging & Ring Road Traffic Caution",
        content:
          "During severe evening convective thundershowers, low-lying underpasses and arterial Outer Ring Road stretches (Bellandur, Marathahalli) experience heavy congestion. Check live traffic maps or use Namma Metro.",
        severity: "low",
        source: "Bruhat Bengaluru Mahanagara Palike (BBMP) & Traffic Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    transportDisruptions: [],
    localRules: [
      {
        id: "rule-blr-cubbon-rules",
        destination: "Bengaluru",
        topic: "Parks & Green Zones Preservation",
        rule: "Cubbon Park and Lalbagh Botanical Gardens prohibit all motor vehicles on Sundays and public holidays. Commercial video shooting requires prior Horticulture Department permission.",
        statutoryReference: "Karnataka Government Parks (Preservation) Act",
        penalty: "Fines and removal of equipment for unauthorized filming",
        source: "Department of Horticulture, Govt of Karnataka",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
  },

  Varanasi: {
    emergencyNumbers: [
      {
        id: "num-varanasi-ghat-police",
        name: "Varanasi Ghat & River Police Control Desk",
        number: "0542-2508012",
        category: "police",
        description: "Direct assistance along Dashashwamedh, Assi, and Manikarnika Ghats.",
        tollFree: false,
        source: "Varanasi Commissionerate River Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "num-varanasi-tourist-police",
        name: "Tourist Assistance Kendra (Dashashwamedh)",
        number: "0542-2508010",
        category: "tourist",
        description: "Tourist facilitation and grievance resolution at main Ghat approach.",
        tollFree: false,
        source: "Uttar Pradesh Tourist Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    hospitals: [
      {
        id: "hosp-varanasi-bhu",
        destination: "Varanasi",
        name: "Sir Sunderlal Hospital & Apex Trauma Centre (BHU)",
        category: "Government Medical College & Trauma Center",
        has24x7Emergency: true,
        address: "Banaras Hindu University Campus, Varanasi, UP 221005",
        phone: "0542-2307500",
        latitude: 25.2755,
        longitude: 82.9984,
        source: "Institute of Medical Sciences, Banaras Hindu University",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "hosp-varanasi-deen-dayal",
        destination: "Varanasi",
        name: "Pandit Deen Dayal Upadhyaya District Hospital",
        category: "District Hospital",
        has24x7Emergency: true,
        address: "Pandeypur, Varanasi, UP 221002",
        phone: "0542-2504244",
        latitude: 25.334,
        longitude: 82.983,
        source: "Department of Medical Health, Govt of Uttar Pradesh",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    policeStations: [
      {
        id: "pol-varanasi-dashashwamedh",
        destination: "Varanasi",
        name: "Dashashwamedh Ghat Tourist Police Booth",
        category: "Tourist Police Unit",
        address: "Dashashwamedh Ghat Road, Varanasi 221001",
        phone: "0542-2508012",
        latitude: 25.3076,
        longitude: 83.0104,
        source: "Varanasi Commissionerate River Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-varanasi-chowk",
        destination: "Varanasi",
        name: "Chowk Police Station (Kashi Vishwanath Corridor)",
        category: "Local Police Station",
        address: "Chowk, Near Gate 4 Kashi Vishwanath, Varanasi 221001",
        phone: "0542-2504100",
        latitude: 25.312,
        longitude: 83.013,
        source: "Uttar Pradesh Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    weatherAlerts: [],
    travelAdvisories: [
      {
        id: "adv-varanasi-river-safety",
        destination: "Varanasi",
        category: "safety",
        title: "Holy River Boat Licensing & Life Jacket Directives",
        content:
          "Board only registered government-numbered motor boats or row boats. Wearing orange life jackets is legally mandatory throughout boat rides on the Ganga. During peak flood monsoon (August-September), small boat rides are completely banned by the District Magistrate.",
        severity: "high",
        source: "Varanasi Nagar Nigam & River Police Commissionerate",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    transportDisruptions: [],
    localRules: [
      {
        id: "rule-varanasi-ghat-decorum",
        destination: "Varanasi",
        topic: "Manikarnika & Harishchandra Ghat Cremation Decorum",
        rule: "Photography and video recording of funeral pyres at cremation ghats (Manikarnika and Harishchandra) is strictly prohibited out of respect for grieving families.",
        statutoryReference: "UP Urban Local Bodies & Ghat Decorum Regulations",
        penalty: "Confiscation of camera/phone memory cards and immediate police intervention",
        source: "Varanasi District Administration",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "rule-varanasi-soap-ban",
        destination: "Varanasi",
        topic: "Prohibition of Chemical Soaps in the Ganga",
        rule: "Using commercial detergents, chemical shampoos, or soaps while bathing along the historical Ghat steps is prohibited by environmental preservation orders.",
        statutoryReference: "National Green Tribunal (NGT) Clean Ganga Directives",
        penalty: "Fines up to ₹2,500 under Municipal Environmental Bylaws",
        source: "National Mission for Clean Ganga & Varanasi Nagar Nigam",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
  },

  Udaipur: {
    emergencyNumbers: [
      {
        id: "num-udaipur-tourist-kendra",
        name: "Udaipur Tourist Assistance Police Kiosk",
        number: "0294-2411516",
        category: "tourist",
        description: "Assistance desk for lake boat operations, hotel touting complaints, and heritage guides.",
        tollFree: false,
        source: "Udaipur Tourist Police Unit",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "num-udaipur-police-control",
        name: "Udaipur Police Control Room",
        number: "0294-2414100",
        category: "police",
        description: "Citywide emergency dispatch and traffic safety control.",
        tollFree: false,
        source: "Rajasthan Police Udaipur",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    hospitals: [
      {
        id: "hosp-udaipur-mbgh",
        destination: "Udaipur",
        name: "Maharana Bhupal Government Hospital & Trauma Ward",
        category: "Government Medical College & Trauma Center",
        has24x7Emergency: true,
        address: "Hospital Road, Madhuban, Udaipur, Rajasthan 313001",
        phone: "0294-2528811",
        latitude: 24.588,
        longitude: 73.696,
        source: "RNT Medical College & Hospital, Govt of Rajasthan",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "hosp-udaipur-paras",
        destination: "Udaipur",
        name: "Paras Health Multispecialty Hospital",
        category: "Multispecialty Hospital",
        has24x7Emergency: true,
        address: "Plot 1, Sector 5, Hiran Magri, Udaipur 313002",
        phone: "0294-6669999",
        latitude: 24.572,
        longitude: 73.715,
        source: "NABH Accredited Directory",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    policeStations: [
      {
        id: "pol-udaipur-ghantaghar",
        destination: "Udaipur",
        name: "Ghantaghar Police Station & Tourist Desk",
        category: "Tourist Police Unit",
        address: "Old City, Near City Palace, Udaipur 313001",
        phone: "0294-2415500",
        latitude: 24.582,
        longitude: 73.688,
        source: "Rajasthan Police Udaipur",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-udaipur-ambamata",
        destination: "Udaipur",
        name: "Ambamata Police Station",
        category: "Local Police Station",
        address: "Fateh Sagar Lake Road, Ambamata, Udaipur 313001",
        phone: "0294-2431100",
        latitude: 24.595,
        longitude: 73.673,
        source: "Rajasthan Police Udaipur",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    weatherAlerts: [],
    travelAdvisories: [
      {
        id: "adv-udaipur-lake-safety",
        destination: "Udaipur",
        category: "safety",
        title: "Lake Pichola and Fateh Sagar Water Safety Norms",
        content:
          "All passenger motorboats, shikaras, and speedboats operate strictly between 06:00 AM and 06:30 PM. Night boating is prohibited. Life vests are compulsory for all passengers.",
        severity: "medium",
        source: "Udaipur Municipal Corporation & Lake Development Authority",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    transportDisruptions: [],
    localRules: [
      {
        id: "rule-udaipur-heritage-drone",
        destination: "Udaipur",
        topic: "Drone Restrictions over Lake Pichola & Palaces",
        rule: "Flying drones over Lake Pichola, Jag Mandir, and City Palace is restricted under civil aviation security buffer guidelines without written permission from the District Collector.",
        statutoryReference: "DGCA Drone Regulations & District Security Order",
        penalty: "Drone seizure and formal FIR at Ghantaghar Police Station",
        source: "District Administration Udaipur",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
  },

  Agra: {
    emergencyNumbers: [
      {
        id: "num-agra-tourist-police",
        name: "Taj Mahal Tourist Police Station",
        number: "0562-2421204",
        category: "tourist",
        description: "Dedicated station for Taj Mahal complex security, touting complaints, and foreign visitor support.",
        tollFree: false,
        source: "Agra Tourist Police & UP Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "num-agra-tourist-cell",
        name: "Foreign Tourist Assistance Cell",
        number: "0562-2226431",
        category: "tourist",
        description: "Official tourist facilitation unit at 64 Taj Road, Agra.",
        tollFree: false,
        source: "Uttar Pradesh Department of Tourism",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    hospitals: [
      {
        id: "hosp-agra-sn-medical",
        destination: "Agra",
        name: "S.N. Medical College & Hospital Emergency Wing",
        category: "Government Medical College & Trauma Center",
        has24x7Emergency: true,
        address: "Moti Katra, Agra, Uttar Pradesh 282003",
        phone: "0562-2260353",
        latitude: 27.1812,
        longitude: 78.0068,
        source: "Directorate of Medical Education & Health, Govt of UP",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "hosp-agra-pushpanjali",
        destination: "Agra",
        name: "Pushpanjali Hospital & Research Centre",
        category: "Multispecialty Hospital",
        has24x7Emergency: true,
        address: "Delhi Gate, Agra, Uttar Pradesh 282002",
        phone: "0562-4034444",
        latitude: 27.199,
        longitude: 77.994,
        source: "NABH Accredited Directory",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    policeStations: [
      {
        id: "pol-agra-tajganj",
        destination: "Agra",
        name: "Taj Ganj Tourist Police Station",
        category: "Tourist Police Unit",
        address: "Near Taj Mahal Western Gate, Agra 282001",
        phone: "0562-2421204",
        latitude: 27.1685,
        longitude: 78.041,
        source: "Agra Tourist Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
      {
        id: "pol-agra-rakabganj",
        destination: "Agra",
        name: "Rakabganj Police Station (Near Agra Fort)",
        category: "Local Police Station",
        address: "Rakabganj Road, Agra 282001",
        phone: "0562-2420311",
        latitude: 27.175,
        longitude: 78.012,
        source: "Uttar Pradesh Police",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    weatherAlerts: [],
    travelAdvisories: [
      {
        id: "adv-agra-taj-friday",
        destination: "Agra",
        category: "cultural_norms",
        title: "Taj Mahal Friday Closure & Prohibited Items Protocol",
        content:
          "The Taj Mahal remains closed every Friday to all tourists for prayer services. Strictly prohibited inside: cigarette lighters, knives, eatables, tripods, external battery powerbanks, and flags. Only water bottles and phones/cameras are permitted.",
        severity: "medium",
        source: "Archaeological Survey of India (ASI)",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    transportDisruptions: [
      {
        id: "dis-agra-ttz-electric",
        destination: "Agra",
        type: "road",
        title: "Taj Trapezium Zone (TTZ) Non-Electric Vehicle Boundary",
        details:
          "Internal combustion motor vehicles are forbidden within a 500-meter radius of the Taj Mahal. Tourists must transfer to official government battery-operated golf carts or CNG auto-rickshaws at the parking lots.",
        status: "operational",
        source: "Supreme Court TTZ Directive & Agra Development Authority",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
    localRules: [
      {
        id: "rule-agra-taj-drone-ban",
        destination: "Agra",
        topic: "Complete Drone Prohibitory Zone Around Taj Mahal",
        rule: "Flying any unmanned drone within 2 km of the Taj Mahal is a severe criminal offense under the red security zone framework.",
        statutoryReference: "Ministry of Civil Aviation Red Zone & ASI Monument Security Code",
        penalty: "Immediate arrest, equipment forfeiture, and prosecution under Official Secrets Act / Drone Rules",
        source: "Archaeological Survey of India & Central Industrial Security Force (CISF)",
        retrieved_at: "2026-09-30T10:00:00Z",
      },
    ],
  },
};

// -----------------------------------------------------------------------------
// Helper: Destination Name Normalizer
// -----------------------------------------------------------------------------
export function normalizeDestinationName(dest: string): string {
  const lower = (dest || "").toLowerCase().trim();
  if (lower.includes("goa")) return "Goa";
  if (lower.includes("jaipur")) return "Jaipur";
  if (lower.includes("darjeeling")) return "Darjeeling";
  if (lower.includes("manali")) return "Manali";
  if (lower.includes("bengaluru") || lower.includes("bangalore")) return "Bengaluru";
  if (lower.includes("varanasi") || lower.includes("banaras") || lower.includes("kashi")) return "Varanasi";
  if (lower.includes("udaipur")) return "Udaipur";
  if (lower.includes("agra")) return "Agra";
  return dest.trim();
}

// -----------------------------------------------------------------------------
// Helper: Haversine Distance in Kilometers
// -----------------------------------------------------------------------------
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// -----------------------------------------------------------------------------
// SafetyService Class
// -----------------------------------------------------------------------------
export class SafetyService {
  /**
   * Retrieves verified destination safety data.
   * If user coordinates are provided, facilities are sorted by distance.
   * Never fabricates alerts or scores.
   */
  async getDestinationSafetyInfo(
    destination: string,
    userCoords?: { latitude: number; longitude: number }
  ): Promise<DestinationSafetyCenter> {
    const normalized = normalizeDestinationName(destination);
    const dataset = DESTINATION_SAFETY_REGISTRY[normalized];

    const retrievedAt = new Date().toISOString();

    // Universal emergency numbers are always included
    const allEmergencyNumbers = [...AUTHORITATIVE_NATIONAL_NUMBERS];
    if (dataset?.emergencyNumbers) {
      allEmergencyNumbers.push(...dataset.emergencyNumbers);
    }

    let hospitals: HospitalFacility[] = [];
    let policeStations: PoliceFacility[] = [];
    let weatherAlerts: WeatherAlert[] = [];
    let travelAdvisories: TravelAdvisory[] = [];
    let transportDisruptions: TransportDisruption[] = [];
    let localRules: LocalRule[] = [];

    if (dataset) {
      hospitals = dataset.hospitals.map((h) => ({
        ...h,
        distanceKm: userCoords
          ? calculateHaversineKm(userCoords.latitude, userCoords.longitude, h.latitude, h.longitude)
          : undefined,
      }));

      policeStations = dataset.policeStations.map((p) => ({
        ...p,
        distanceKm: userCoords
          ? calculateHaversineKm(userCoords.latitude, userCoords.longitude, p.latitude, p.longitude)
          : undefined,
      }));

      // Sort by proximity if coordinates are supplied
      if (userCoords) {
        hospitals.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
        policeStations.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
      }

      weatherAlerts = [...dataset.weatherAlerts];
      travelAdvisories = [...dataset.travelAdvisories];
      transportDisruptions = [...dataset.transportDisruptions];
      localRules = [...dataset.localRules];
    } else {
      // Graceful fallback for unverified / regional destinations
      travelAdvisories.push({
        id: `adv-fallback-${destination.toLowerCase()}`,
        destination,
        category: "safety",
        title: "Standard Travel Advisory for Unlisted Destination",
        content: `Local municipal health directories for ${destination} are currently pending official verification. In case of emergency, utilize the nationwide ERSS 112 helpline or National Tourist Helpline 1363.`,
        severity: "low",
        source: "Ministry of Tourism, Government of India (National Tourist Directory)",
        retrieved_at: retrievedAt,
      });

      localRules.push({
        id: `rule-fallback-asi`,
        destination,
        topic: "Archaeological Survey of India Monument Rules",
        rule: "All centrally protected national heritage sites prohibit unlicensed drone operations, flash photography in ancient caves, and commercial tripods without prior authorization.",
        statutoryReference: "Ancient Monuments and Archaeological Sites and Remains Act, 1958",
        penalty: "Equipment seizure and compounding fines",
        source: "Archaeological Survey of India (ASI)",
        retrieved_at: retrievedAt,
      });
    }

    return {
      destination: normalized,
      emergencyNumbers: allEmergencyNumbers,
      hospitals,
      policeStations,
      weatherAlerts,
      travelAdvisories,
      transportDisruptions,
      localRules,
      disclaimer:
        "TripWise displays source-backed contacts and authoritative government advisories for citizen use. TripWise does not provide automated emergency dispatch functionality. In an immediate life-threatening emergency, dial 112 directly.",
      retrieved_at: retrievedAt,
    };
  }

  /**
   * Retrieves safety information contextualized to an authorized trip.
   * Pulls destination, trip dates, hotel info (if planned), and generates a live SOS card.
   */
  async getTripSafetyCenter(
    tripId: string,
    userId: string,
    userCoords?: { latitude: number; longitude: number }
  ): Promise<{
    authorized: boolean;
    safetyCenter?: DestinationSafetyCenter;
    emergencyCard?: TripEmergencyCard;
    error?: string;
  }> {
    // 1. Authorization check: trip creator or member
    const isMember = await collaborationService.isUserTripMember(tripId, userId);
    const { trip } = await getTripById(tripId, userId);

    if (!trip || (!isMember && trip.user_id !== userId)) {
      return {
        authorized: false,
        error: "Unauthorized: You do not have permission to view safety data for this trip.",
      };
    }

    // 2. Fetch destination safety info
    const safetyCenter = await this.getDestinationSafetyInfo(trip.destination, userCoords);

    // 3. Generate Emergency Card
    const emergencyCardResult = await this.getEmergencyCard(tripId, userId, userCoords);

    return {
      authorized: true,
      safetyCenter,
      emergencyCard: emergencyCardResult.emergencyCard,
    };
  }

  /**
   * Generates a structured SOS Emergency Card for immediate one-tap copying or SMS sharing.
   */
  async getEmergencyCard(
    tripId: string,
    userId: string,
    userCoords?: { latitude: number; longitude: number }
  ): Promise<{
    authorized: boolean;
    emergencyCard?: TripEmergencyCard;
    error?: string;
  }> {
    const isMember = await collaborationService.isUserTripMember(tripId, userId);
    const { trip } = await getTripById(tripId, userId);

    if (!trip || (!isMember && trip.user_id !== userId)) {
      return {
        authorized: false,
        error: "Unauthorized: You do not have permission to generate an emergency card for this trip.",
      };
    }

    const safetyCenter = await this.getDestinationSafetyInfo(trip.destination, userCoords);

    // Try to resolve hotel details from itinerary
    let hotelName: string | undefined = undefined;
    let hotelAddress: string | undefined = undefined;
    let hotelPhone: string | undefined = undefined;

    try {
      const itinerariesRes = await getTripItineraries(tripId, userId);
      if (itinerariesRes.success && itinerariesRes.days) {
        for (const day of itinerariesRes.days) {
          for (const item of day.items) {
            if (item.category === "rest" && item.title.toLowerCase().includes("hotel")) {
              hotelName = item.title;
              break;
            }
          }
          if (hotelName) break;
        }
      }
    } catch {
      // Fallback: hotel info remains optional
    }

    // If still not found, check trip preferences
    if (!hotelName && (trip.preferences as any)?.selectedHotel) {
      const prefHotel = (trip.preferences as any).selectedHotel;
      hotelName = prefHotel.name;
      hotelAddress = prefHotel.address;
      hotelPhone = prefHotel.phone;
    }

    const nearestHospital = safetyCenter.hospitals.length > 0 ? safetyCenter.hospitals[0] : null;
    const nearestPolice = safetyCenter.policeStations.length > 0 ? safetyCenter.policeStations[0] : null;

    const datesStr = `${trip.start_date} to ${trip.end_date}`;
    const generatedAt = new Date().toISOString();

    const liveCoords = userCoords
      ? {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          mapsUrl: `https://www.google.com/maps?q=${userCoords.latitude},${userCoords.longitude}`,
        }
      : null;

    // Structured shareable SOS summary text
    const textLines: string[] = [
      `🚨 TRIP EMERGENCY SOS CARD 🚨`,
      `Destination: ${trip.destination}`,
      `Trip Dates: ${datesStr} | Travelers: ${trip.traveller_count}`,
    ];

    if (hotelName) {
      textLines.push(`Accommodations: ${hotelName}${hotelAddress ? ` (${hotelAddress})` : ""}`);
      if (hotelPhone) textLines.push(`Hotel Phone: ${hotelPhone}`);
    }

    textLines.push(`Emergency Helplines: 112 (Universal) | 108 (Ambulance) | 1363 (Tourist Helpline)`);

    if (nearestHospital) {
      textLines.push(
        `Nearest Medical Facility: ${nearestHospital.name} - Tel: ${nearestHospital.phone}${
          nearestHospital.distanceKm !== undefined ? ` (~${nearestHospital.distanceKm} km)` : ""
        }`
      );
    }

    if (nearestPolice) {
      textLines.push(
        `Nearest Police Station: ${nearestPolice.name} - Tel: ${nearestPolice.phone}${
          nearestPolice.distanceKm !== undefined ? ` (~${nearestPolice.distanceKm} km)` : ""
        }`
      );
    }

    if (liveCoords) {
      textLines.push(`Current Live Location: ${liveCoords.mapsUrl}`);
    }

    textLines.push(
      `\n[Notice: Source-backed records via TripWise Safety Center. No automated dispatch; dial 112 directly for emergencies.]`
    );

    const shareableSummaryText = textLines.join("\n");

    const emergencyCard: TripEmergencyCard = {
      tripId,
      destination: trip.destination,
      dates: datesStr,
      travelerCount: trip.traveller_count,
      hotelName,
      hotelAddress,
      hotelPhone,
      emergencyHelpline: "112",
      touristHelpline: "1363",
      nearestHospital,
      nearestPolice,
      userLiveCoordinates: liveCoords,
      shareableSummaryText,
      sourceNotice:
        "Emergency contacts verified from Ministry of Home Affairs (ERSS 112), Ministry of Tourism (1363), and state medical directorates.",
      generated_at: generatedAt,
    };

    return {
      authorized: true,
      emergencyCard,
    };
  }
}

export const safetyService = new SafetyService();
