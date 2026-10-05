/**
 * Comprehensive India Tourism Knowledge Base
 * Synthesizes official data from:
 * 1. Ministry of Tourism (Incredible India) - official descriptions, heritage status, circuits, statistics
 * 2. NATMO (National Atlas and Thematic Mapping Organisation) - thematic classification, spatial circuits
 * 3. OpenStreetMap (OSM) - high-precision coordinates, POI infrastructure
 * 4. GeoNames - authoritative administrative hierarchy (State -> District -> City)
 */

import { IndiaTourismLocation, StateUTSummary } from '@/types/india-tourism';

// ==============================================================================
// 1. All 28 States and 8 Union Territories of India (GeoNames & Survey of India)
// ==============================================================================

export const ALL_STATES_AND_UTS: StateUTSummary[] = [
  // 28 States
  {
    name: 'Andhra Pradesh',
    capital: 'Amaravati',
    is_union_territory: false,
    zone: 'South',
    districts_count: 26,
    major_attractions_count: 5,
    top_destinations: ['Tirupati', 'Visakhapatnam', 'Araku Valley', 'Lepakshi', 'Amaravati'],
    primary_tourism_themes: ['Spiritual', 'Coastal Beaches', 'Scenic Valleys', 'Buddhist Heritage'],
    description: 'Land of sacred pilgrimage centers, scenic Coromandel coastline, and ancient rock architecture.'
  },
  {
    name: 'Arunachal Pradesh',
    capital: 'Itanagar',
    is_union_territory: false,
    zone: 'North-East',
    districts_count: 26,
    major_attractions_count: 4,
    top_destinations: ['Tawang', 'Ziro Valley', 'Namdapha', 'Bhalukpong'],
    primary_tourism_themes: ['Himalayan Monasteries', 'Tribal Culture', 'Alpine Valleys', 'Biodiversity'],
    description: 'The Land of Dawn-lit Mountains, renowned for Tawang Monastery and pristine eastern Himalayan wilderness.'
  },
  {
    name: 'Assam',
    capital: 'Dispur',
    is_union_territory: false,
    zone: 'North-East',
    districts_count: 31,
    major_attractions_count: 5,
    top_destinations: ['Kaziranga', 'Guwahati', 'Majuli Island', 'Manas', 'Sivasagar'],
    primary_tourism_themes: ['Wildlife & Rhinos', 'Tea Gardens', 'Brahmaputra River', 'Ahom Monuments'],
    description: 'Gateway to Northeast India, famous for one-horned rhinoceroses, world-renowned tea estates, and sacred river islands.'
  },
  {
    name: 'Bihar',
    capital: 'Patna',
    is_union_territory: false,
    zone: 'East',
    districts_count: 38,
    major_attractions_count: 4,
    top_destinations: ['Bodh Gaya', 'Nalanda', 'Rajgir', 'Vaishali'],
    primary_tourism_themes: ['Buddhist Circuit', 'Ancient Universities', 'Jain Heritage', 'Ganges Heritage'],
    description: 'Birthplace of Buddhism and Jainism, home to UNESCO Mahabodhi Temple and ancient Nalanda Mahavihara.'
  },
  {
    name: 'Chhattisgarh',
    capital: 'Raipur',
    is_union_territory: false,
    zone: 'Central',
    districts_count: 33,
    major_attractions_count: 4,
    top_destinations: ['Bastar', 'Chitrakote Falls', 'Sirpur', 'Barnawapara'],
    primary_tourism_themes: ['Waterfalls', 'Tribal Handicrafts', 'Eco-Tourism', 'Ancient Temples'],
    description: 'The green heart of India, celebrated for Chitrakote (Niagara of India), indigenous art, and dense sal forests.'
  },
  {
    name: 'Goa',
    capital: 'Panaji',
    is_union_territory: false,
    zone: 'West',
    districts_count: 2,
    major_attractions_count: 6,
    top_destinations: ['North Goa Beaches', 'South Goa Coast', 'Old Goa', 'Dudhsagar'],
    primary_tourism_themes: ['Beaches', 'Portuguese Baroque Architecture', 'Watersports', 'Eco-Waterfalls'],
    description: 'Indo-Portuguese coastal paradise renowned for UNESCO churches, golden sandy beaches, and lush Western Ghats.'
  },
  {
    name: 'Gujarat',
    capital: 'Gandhinagar',
    is_union_territory: false,
    zone: 'West',
    districts_count: 33,
    major_attractions_count: 6,
    top_destinations: ['Statue of Unity', 'Rann of Kutch', 'Gir Forest', 'Somnath', 'Dwarka', 'Ahmedabad'],
    primary_tourism_themes: ['Asiatic Lions', 'White Desert', 'Monumental Engineering', 'Maritime Pilgrimage'],
    description: 'Land of legends and enterprise, featuring the world\'s tallest statue, the Great Rann salt desert, and Asiatic lion sanctuary.'
  },
  {
    name: 'Haryana',
    capital: 'Chandigarh',
    is_union_territory: false,
    zone: 'North',
    districts_count: 22,
    major_attractions_count: 3,
    top_destinations: ['Kurukshetra', 'Sultanpur Bird Sanctuary', 'Pinjore Gardens'],
    primary_tourism_themes: ['Epic Mahabharata Heritage', 'Migratory Bird Watching', 'Mughal Terraced Gardens'],
    description: 'Cradle of ancient Vedic culture, battleground of Kurukshetra, and urban oasis nature reserves.'
  },
  {
    name: 'Himachal Pradesh',
    capital: 'Shimla',
    is_union_territory: false,
    zone: 'North',
    districts_count: 12,
    major_attractions_count: 6,
    top_destinations: ['Manali', 'Shimla', 'Dharamshala', 'Spiti Valley', 'Kasol', 'Dalhousie'],
    primary_tourism_themes: ['Himalayan Hill Stations', 'Tibetan Culture', 'Adventure Trekking', 'High Passes'],
    description: 'Land of gods with majestic snow-covered peaks, apple orchards, colonial summer retreats, and high-altitude Buddhist valleys.'
  },
  {
    name: 'Jharkhand',
    capital: 'Ranchi',
    is_union_territory: false,
    zone: 'East',
    districts_count: 24,
    major_attractions_count: 4,
    top_destinations: ['Deoghar', 'Betla National Park', 'Hundru Falls', 'Parasnath'],
    primary_tourism_themes: ['Jyotirlinga Pilgrimage', 'Waterfalls', 'Tiger Reserves', 'Jain Tirthankara Shrines'],
    description: 'Mineral-rich forest state home to Baba Baidyanath Dham Jyotirlinga, scenic plateau waterfalls, and wildlife.'
  },
  {
    name: 'Karnataka',
    capital: 'Bengaluru',
    is_union_territory: false,
    zone: 'South',
    districts_count: 31,
    major_attractions_count: 6,
    top_destinations: ['Hampi', 'Mysuru', 'Coorg', 'Badami', 'Gokarna', 'Bengaluru'],
    primary_tourism_themes: ['Vijayanagara Ruins', 'Hoysala Architecture', 'Coffee Plantations', 'Pristine Coastline'],
    description: 'One state with many worlds: UNESCO World Heritage site Hampi, royal Mysuru palaces, and misty Western Ghats coffee hills.'
  },
  {
    name: 'Kerala',
    capital: 'Thiruvananthapuram',
    is_union_territory: false,
    zone: 'South',
    districts_count: 14,
    major_attractions_count: 6,
    top_destinations: ['Alappuzha (Alleppey)', 'Munnar', 'Kochi', 'Wayanad', 'Varkala', 'Thekkady'],
    primary_tourism_themes: ['Backwater Houseboats', 'Tea Hills', 'Ayurveda & Wellness', 'Spice Plantations'],
    description: 'God\'s Own Country, famed for tranquil palm-fringed backwaters, misty Western Ghat hill stations, and Kathakali culture.'
  },
  {
    name: 'Madhya Pradesh',
    capital: 'Bhopal',
    is_union_territory: false,
    zone: 'Central',
    districts_count: 55,
    major_attractions_count: 6,
    top_destinations: ['Khajuraho', 'Kanha', 'Bandhavgarh', 'Sanchi', 'Gwalior', 'Ujjain'],
    primary_tourism_themes: ['UNESCO Erotic Temple Art', 'Tiger Safaris', 'Buddhist Stupas', 'Forts & Palaces'],
    description: 'Heart of Incredible India, holding premier tiger reserves, UNESCO Khajuraho temples, and the Great Stupa of Sanchi.'
  },
  {
    name: 'Maharashtra',
    capital: 'Mumbai',
    is_union_territory: false,
    zone: 'West',
    districts_count: 36,
    major_attractions_count: 6,
    top_destinations: ['Mumbai', 'Ajanta & Ellora', 'Pune', 'Shirdi', 'Mahabaleshwar', 'Tadoba'],
    primary_tourism_themes: ['UNESCO Rock-Cut Caves', 'Commercial Metropolis', 'Maratha Forts', 'Western Ghat Escarpments'],
    description: 'Dynamic economic hub rich with UNESCO rock-cut cave masterpieces, Maratha hill forts, and coastal Konkan beauty.'
  },
  {
    name: 'Manipur',
    capital: 'Imphal',
    is_union_territory: false,
    zone: 'North-East',
    districts_count: 16,
    major_attractions_count: 3,
    top_destinations: ['Loktak Lake', 'Imphal (Kangla Fort)', 'Keibul Lamjao'],
    primary_tourism_themes: ['Floating Phumdis', 'Sangai Deer Habitat', 'WWII Battlefields', 'Classical Dance'],
    description: 'Jewel of India, home to Loktak—the world\'s only floating national park—and rich classical martial arts heritage.'
  },
  {
    name: 'Meghalaya',
    capital: 'Shillong',
    is_union_territory: false,
    zone: 'North-East',
    districts_count: 12,
    major_attractions_count: 5,
    top_destinations: ['Cherrapunji (Sohra)', 'Shillong', 'Dawki', 'Mawlynnong'],
    primary_tourism_themes: ['Living Root Bridges', 'Waterfalls', 'Crystal Rivers', 'Cleanest Village'],
    description: 'Abode of Clouds, celebrated for bio-engineered living root bridges, plunging waterfalls, and the crystal-clear Umngot river.'
  },
  {
    name: 'Mizoram',
    capital: 'Aizawl',
    is_union_territory: false,
    zone: 'North-East',
    districts_count: 11,
    major_attractions_count: 3,
    top_destinations: ['Aizawl', 'Reiek', 'Vantawng Falls', 'Phawngpui'],
    primary_tourism_themes: ['Bamboo Groves', 'Blue Mountain Trekking', 'Cascading Waterfalls', 'Mizo Culture'],
    description: 'Peaceful hill state offering dramatic mountain ridges, cascading waterfalls, and rich indigenous cultural festivals.'
  },
  {
    name: 'Nagaland',
    capital: 'Kohima',
    is_union_territory: false,
    zone: 'North-East',
    districts_count: 16,
    major_attractions_count: 3,
    top_destinations: ['Kohima', 'Dzukou Valley', 'Kisama (Hornbill Village)', 'Mokokchung'],
    primary_tourism_themes: ['Hornbill Festival', 'Dzukou Floral Valley', 'Tribal Heritage', 'WWII Memorials'],
    description: 'Land of festivals and warrior traditions, famous for the international Hornbill Festival and pristine valleys.'
  },
  {
    name: 'Odisha',
    capital: 'Bhubaneswar',
    is_union_territory: false,
    zone: 'East',
    districts_count: 30,
    major_attractions_count: 5,
    top_destinations: ['Puri', 'Konark', 'Bhubaneswar', 'Chilika Lake', 'Simlipal'],
    primary_tourism_themes: ['UNESCO Sun Temple', 'Jagannath Dham', 'Brackish Lagoons & Dolphins', 'Kalinga Architecture'],
    description: 'Soul of India, home to the architectural wonder Konark Sun Temple, sacred Puri Jagannath Dham, and Chilika lagoon.'
  },
  {
    name: 'Punjab',
    capital: 'Chandigarh',
    is_union_territory: false,
    zone: 'North',
    districts_count: 23,
    major_attractions_count: 4,
    top_destinations: ['Amritsar', 'Wagah Border', 'Anandpur Sahib', 'Patiala'],
    primary_tourism_themes: ['Golden Temple Sikh Shrine', 'Patriotic Border Ceremonies', 'Culinary Gastronomy', 'Royal Palaces'],
    description: 'Land of five rivers, celebrated for Sri Harmandir Sahib (Golden Temple), unmatched culinary hospitality, and vibrant folk heritage.'
  },
  {
    name: 'Rajasthan',
    capital: 'Jaipur',
    is_union_territory: false,
    zone: 'West',
    districts_count: 50,
    major_attractions_count: 7,
    top_destinations: ['Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Ranthambore', 'Pushkar'],
    primary_tourism_themes: ['Forts & UNESCO Palaces', 'Desert Sand Dunes', 'Tiger Safaris', 'Royal Hospitality'],
    description: 'Regal kingdom of royalty featuring impregnable hill forts, desert safari camps, majestic palaces, and vibrant bazaars.'
  },
  {
    name: 'Sikkim',
    capital: 'Gangtok',
    is_union_territory: false,
    zone: 'North-East',
    districts_count: 6,
    major_attractions_count: 5,
    top_destinations: ['Gangtok', 'Tsomgo Lake', 'Nathula Pass', 'Pelling', 'Gurudongmar'],
    primary_tourism_themes: ['Mount Kanchenjunga', 'Glacial Lakes', 'Organic Tourism', 'Buddhist Monasteries'],
    description: 'India\'s first 100% organic state, set in the shadow of Mount Kanchenjunga with sacred alpine lakes and ancient monasteries.'
  },
  {
    name: 'Tamil Nadu',
    capital: 'Chennai',
    is_union_territory: false,
    zone: 'South',
    districts_count: 38,
    major_attractions_count: 7,
    top_destinations: ['Madurai', 'Thanjavur', 'Mahabalipuram', 'Ooty', 'Kanyakumari', 'Rameswaram'],
    primary_tourism_themes: ['Dravidian Temples', 'Chola Architecture', 'Nilgiri Hill Stations', 'Land\'s End Coastal Point'],
    description: 'Land of soaring temple gopurams, ancient Dravidian classical heritage, Nilgiri mountain railways, and historic coastal ports.'
  },
  {
    name: 'Telangana',
    capital: 'Hyderabad',
    is_union_territory: false,
    zone: 'South',
    districts_count: 33,
    major_attractions_count: 4,
    top_destinations: ['Hyderabad', 'Warangal', 'Ramappa Temple', 'Nagarjuna Sagar'],
    primary_tourism_themes: ['Qutb Shahi Monuments', 'UNESCO Ramappa Temple', 'Culinary Biryani', 'Kakatiya Heritage'],
    description: 'Dynamic tech metropolis fused with historic Qutb Shahi architecture, Golconda diamond heritage, and Kakatiya stone craft.'
  },
  {
    name: 'Tripura',
    capital: 'Agartala',
    is_union_territory: false,
    zone: 'North-East',
    districts_count: 8,
    major_attractions_count: 3,
    top_destinations: ['Agartala (Ujjayanta Palace)', 'Neermahal', 'Unakoti'],
    primary_tourism_themes: ['Water Palaces', 'Rock-Cut Bas Reliefs', 'Manikya Royal Heritage'],
    description: 'Picturesque princely state known for Neermahal water palace and the enigmatic colossal rock carvings of Unakoti.'
  },
  {
    name: 'Uttar Pradesh',
    capital: 'Lucknow',
    is_union_territory: false,
    zone: 'North',
    districts_count: 75,
    major_attractions_count: 8,
    top_destinations: ['Agra', 'Varanasi', 'Ayodhya', 'Lucknow', 'Sarnath', 'Mathura & Vrindavan'],
    primary_tourism_themes: ['UNESCO Wonders (Taj Mahal)', 'Ganga Aarti Spiritual Centers', 'Nawabi Culture & Cuisine', 'Mughal Architecture'],
    description: 'Cradle of civilization and spirituality, home to the iconic Taj Mahal, eternal Varanasi ghats, and royal Awadhi cuisine.'
  },
  {
    name: 'Uttarakhand',
    capital: 'Dehradun',
    is_union_territory: false,
    zone: 'North',
    districts_count: 13,
    major_attractions_count: 6,
    top_destinations: ['Rishikesh', 'Haridwar', 'Nainital', 'Jim Corbett', 'Mussoorie', 'Kedarnath & Badrinath'],
    primary_tourism_themes: ['Yoga Capital & Rafting', 'Chardham Himalayan Pilgrimage', 'Wildlife Safaris', 'Lake Towns'],
    description: 'Devbhoomi (Land of Gods), combining high-adrenaline river rafting in Rishikesh, sacred Himalayan shrines, and premier tiger reserves.'
  },
  {
    name: 'West Bengal',
    capital: 'Kolkata',
    is_union_territory: false,
    zone: 'East',
    districts_count: 23,
    major_attractions_count: 5,
    top_destinations: ['Kolkata', 'Darjeeling', 'Sundarbans', 'Kalimpong', 'Bishnupur'],
    primary_tourism_themes: ['Colonial & Literary Heritage', 'Himalayan Toy Train', 'Royal Bengal Tigers in Mangroves', 'Terracotta Art'],
    description: 'Vibrant cultural heartland stretching from the Himalayan peaks of Darjeeling to the tidal mangrove forests of the Sundarbans.'
  },

  // 8 Union Territories
  {
    name: 'Andaman and Nicobar Islands',
    capital: 'Port Blair',
    is_union_territory: true,
    zone: 'Islands',
    districts_count: 3,
    major_attractions_count: 4,
    top_destinations: ['Port Blair', 'Havelock (Swaraj Dweep)', 'Neil (Shaheed Dweep)', 'Baratang'],
    primary_tourism_themes: ['Coral Reef Scuba Diving', 'Freedom Struggle Heritage', 'Pristine White Beaches', 'Mangrove Creeks'],
    description: 'Tropical archipelago in the Bay of Bengal, known for historic Cellular Jail and world-class coral scuba diving.'
  },
  {
    name: 'Chandigarh',
    capital: 'Chandigarh',
    is_union_territory: true,
    zone: 'North',
    districts_count: 1,
    major_attractions_count: 3,
    top_destinations: ['Rock Garden', 'Sukhna Lake', 'Capitol Complex'],
    primary_tourism_themes: ['Le Corbusier Architecture', 'Recycled Art Sculptures', 'Lake Leisure'],
    description: 'India\'s master-planned modernist city designed by Le Corbusier, famous for Nek Chand\'s sculpture Rock Garden.'
  },
  {
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    capital: 'Daman',
    is_union_territory: true,
    zone: 'West',
    districts_count: 3,
    major_attractions_count: 3,
    top_destinations: ['Diu Island', 'Daman Forts', 'Silvassa'],
    primary_tourism_themes: ['Portuguese Coastal Forts', 'Quiet Beaches', 'Tribal Cultural Museums'],
    description: 'Coastal and forest enclave combining 16th-century Portuguese fortress architecture with serene beaches.'
  },
  {
    name: 'Delhi',
    capital: 'New Delhi',
    is_union_territory: true,
    zone: 'North',
    districts_count: 11,
    major_attractions_count: 6,
    top_destinations: ['Central Delhi', 'Old Delhi', 'South Delhi Heritage Belt'],
    primary_tourism_themes: ['UNESCO Monuments', 'Culinary Food Hubs', 'Power Politics & Museums', 'Bustling Bazaars'],
    description: 'National Capital Territory spanning three millennia of empires, from Mughal Red Fort to Lutyens\' colonial grandeur.'
  },
  {
    name: 'Jammu and Kashmir',
    capital: 'Srinagar (Summer) / Jammu (Winter)',
    is_union_territory: true,
    zone: 'North',
    districts_count: 20,
    major_attractions_count: 6,
    top_destinations: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Vaishno Devi (Katra)', 'Sonamarg'],
    primary_tourism_themes: ['Houseboats on Dal Lake', 'Skiing & Winter Sports', 'Alpine Meadows', 'Spiritual Pilgrimage'],
    description: 'Paradise on Earth, celebrated for tranquil Shikara rides on Dal Lake, snow sports in Gulmarg, and scenic saffron valleys.'
  },
  {
    name: 'Ladakh',
    capital: 'Leh',
    is_union_territory: true,
    zone: 'North',
    districts_count: 2,
    major_attractions_count: 5,
    top_destinations: ['Leh', 'Pangong Tso', 'Nubra Valley', 'Zanskar', 'Khardung La'],
    primary_tourism_themes: ['High-Altitude Passes', 'Bactrian Camel Dunes', 'Buddhist Gompas', 'Highland Salt Lakes'],
    description: 'High-altitude Himalayan desert characterized by dramatic barren landscapes, dramatic Buddhist gompas, and azure lakes.'
  },
  {
    name: 'Lakshadweep',
    capital: 'Kavaratti',
    is_union_territory: true,
    zone: 'Islands',
    districts_count: 1,
    major_attractions_count: 3,
    top_destinations: ['Agatti Island', 'Bangaram Atoll', 'Kavaratti'],
    primary_tourism_themes: ['Coral Atolls & Lagoons', 'Snorkeling & Scuba', 'Pristine Eco-Tourism'],
    description: 'Untouched archipelago of 36 coral atolls and turquoise lagoons in the Arabian Sea with world-class marine life.'
  },
  {
    name: 'Puducherry',
    capital: 'Pondicherry',
    is_union_territory: true,
    zone: 'South',
    districts_count: 4,
    major_attractions_count: 4,
    top_destinations: ['White Town French Quarter', 'Auroville', 'Promenade Beach', 'Paradise Beach'],
    primary_tourism_themes: ['French Colonial Boulevards', 'Spiritual Meditation', 'Boutique Cafes', 'Golden Sand Beaches'],
    description: 'French Riviera of the East, famed for mustard-yellow colonial villas, tranquil Auroville township, and seaside promenades.'
  }
];

// ==============================================================================
// 2. Canonical India Tourism Locations (Merged & Deduplicated across MoT, NATMO, OSM, GeoNames)
// ==============================================================================

export const INDIA_TOURISM_LOCATIONS: IndiaTourismLocation[] = [
  // ----------------------------------------------------------------------------
  // ANDHRA PRADESH
  // ----------------------------------------------------------------------------
  {
    id: 'tirumala-venkateswara-temple-tirupati',
    name: 'Tirumala Venkateswara Temple',
    aliases: ['Tirupati Balaji', 'Tirumala Temple'],
    state: 'Andhra Pradesh',
    district: 'Tirupati',
    city: 'Tirupati',
    latitude: 13.6833,
    longitude: 79.3472,
    category: 'temple',
    description:
      'One of the most visited and revered Hindu shrines in the world, dedicated to Lord Venkateswara atop the scenic Seshachalam Hills.',
    tourism_tags: ['spiritual', 'dravidian_architecture', 'pilgrimage', 'hills', 'natmo_spiritual_circuit'],
    nearby_attractions: ['Silathoranam Rock Arch', 'Kapila Theertham', 'Sri Padmavathi Ammavari Temple'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Tirupati Spiritual Circuit', unesco_recognized: false, osm_id: 'node/312019283' }
    },
    operational: {
      best_time_to_visit: 'September to March',
      ideal_duration_hours: 4,
      opening_time: '03:00',
      closing_time: '23:30',
      entry_fee_inr: 0,
      nearest_airport: 'Tirupati International Airport (TIR)',
      nearest_railway: 'Tirupati Main (TPTY)'
    }
  },
  {
    id: 'borra-caves-araku-valley',
    name: 'Borra Caves & Araku Valley',
    aliases: ['Borra Guhalu', 'Araku Hill Station'],
    state: 'Andhra Pradesh',
    district: 'Alluri Sitharama Raju',
    city: 'Araku Valley',
    latitude: 18.2804,
    longitude: 83.0396,
    category: 'cave',
    description:
      'Million-year-old million limestone karst caves illuminated with natural stalactites and stalagmites, located in the misty coffee-growing Araku Valley.',
    tourism_tags: ['natural_attraction', 'cave', 'geological_wonder', 'hill_station', 'coffee_plantations'],
    nearby_attractions: ['Katiki Waterfalls', 'Araku Tribal Museum', 'Padmapuram Gardens'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'NATMO',
      details: { natmo_theme: 'Geological & Ecological Wonders', osm_id: 'way/28192819' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '10:00',
      closing_time: '17:00',
      entry_fee_inr: 80,
      nearest_airport: 'Visakhapatnam Airport (VTZ)',
      nearest_railway: 'Borra Guhalu Station'
    }
  },

  // ----------------------------------------------------------------------------
  // ARUNACHAL PRADESH
  // ----------------------------------------------------------------------------
  {
    id: 'tawang-monastery-arunachal',
    name: 'Tawang Monastery',
    aliases: ['Galden Namgey Lhatse', 'Tawang Gompa'],
    state: 'Arunachal Pradesh',
    district: 'Tawang',
    city: 'Tawang',
    latitude: 27.5861,
    longitude: 91.8594,
    category: 'temple',
    description:
      'The largest Buddhist monastery in India and second largest in the world, perched at 10,000 feet amidst snow-clad eastern Himalayan peaks.',
    tourism_tags: ['buddhist_monastery', 'himalayan', 'tibetan_art', 'high_altitude', 'spirituality'],
    nearby_attractions: ['Sela Pass', 'Madhuri Lake (Sangetsar)', 'Tawang War Memorial'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Buddhist Eastern Circuit', unesco_recognized: false }
    },
    operational: {
      best_time_to_visit: 'March to June & September to November',
      ideal_duration_hours: 3,
      opening_time: '07:00',
      closing_time: '18:00',
      entry_fee_inr: 0,
      nearest_airport: 'Tezpur Airport (TEZ) / Guwahati (GAU)',
      nearest_railway: 'Bhalukpong Railway Station'
    }
  },

  // ----------------------------------------------------------------------------
  // ASSAM
  // ----------------------------------------------------------------------------
  {
    id: 'kaziranga-national-park-assam',
    name: 'Kaziranga National Park',
    aliases: ['Kaziranga Rhino Sanctuary'],
    state: 'Assam',
    district: 'Golaghat',
    city: 'Bokakhat',
    latitude: 26.5775,
    longitude: 93.1711,
    category: 'national_park',
    description:
      'UNESCO World Heritage Site sheltering two-thirds of the planet\'s great one-horned rhinoceros population across lush elephant grass and wetlands.',
    tourism_tags: ['unesco_world_heritage', 'wildlife', 'safari', 'one_horned_rhino', 'wetlands'],
    nearby_attractions: ['Kakochang Waterfalls', 'Kaziranga National Orchid Park', 'Majuli Island'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Assam Wildlife Circuit', unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'November to April',
      ideal_duration_hours: 5,
      opening_time: '05:30',
      closing_time: '16:00',
      entry_fee_inr: 100,
      nearest_airport: 'Jorhat Airport (JRH) / Guwahati (GAU)',
      nearest_railway: 'Furkating Junction (FKG)'
    }
  },
  {
    id: 'kamakhya-temple-guwahati',
    name: 'Kamakhya Temple',
    aliases: ['Kamakhya Devalaya'],
    state: 'Assam',
    district: 'Kamrup Metropolitan',
    city: 'Guwahati',
    latitude: 26.1664,
    longitude: 91.7054,
    category: 'temple',
    description:
      'Ancient Shakti Peetha atop Nilachal Hill, revered for its unique Tantric traditions, architectural beehive domes, and annual Ambubachi Mela.',
    tourism_tags: ['shakti_peetha', 'tantric_heritage', 'panoramic_view', 'spiritual', 'ancient'],
    nearby_attractions: ['Umananda Peacock Island', 'Brahmaputra Heritage Centre', 'Deepor Beel'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2.5,
      opening_time: '05:30',
      closing_time: '20:00',
      entry_fee_inr: 0,
      nearest_airport: 'Lokpriya Gopinath Bordoloi International (GAU)',
      nearest_railway: 'Guwahati Junction (GHY)'
    }
  },

  // ----------------------------------------------------------------------------
  // BIHAR
  // ----------------------------------------------------------------------------
  {
    id: 'mahabodhi-temple-bodh-gaya',
    name: 'Mahabodhi Temple Complex',
    aliases: ['Bodh Gaya Mahavihara'],
    state: 'Bihar',
    district: 'Gaya',
    city: 'Bodh Gaya',
    latitude: 24.696,
    longitude: 84.9914,
    category: 'temple',
    description:
      'UNESCO World Heritage Site marking the sacred spot where Gautama Buddha attained supreme enlightenment beneath the Bodhi Tree in 531 BCE.',
    tourism_tags: ['unesco_world_heritage', 'buddhist_holy_site', 'bodhi_tree', 'ancient_brick_architecture'],
    nearby_attractions: ['Great Buddha Statue', 'Thai Monastery Bodh Gaya', 'Muchalinda Lake'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Buddhist Pilgrimage Circuit', unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '05:00',
      closing_time: '21:00',
      entry_fee_inr: 0,
      nearest_airport: 'Gaya Airport (GAY)',
      nearest_railway: 'Gaya Junction (GAYA)'
    }
  },
  {
    id: 'nalanda-university-ruins-bihar',
    name: 'Nalanda Mahavihara Ruins',
    aliases: ['Ancient Nalanda University'],
    state: 'Bihar',
    district: 'Nalanda',
    city: 'Rajgir',
    latitude: 25.136,
    longitude: 85.445,
    category: 'historical_monument',
    description:
      'UNESCO World Heritage ruins of one of the world\'s earliest residential international universities (5th-12th century CE) spanning monasteries and stupas.',
    tourism_tags: ['unesco_world_heritage', 'ancient_university', 'archaeological_ruins', 'learning_center'],
    nearby_attractions: ['Nalanda Archaeological Museum', 'Vishwa Shanti Stupa Rajgir', 'Hiuen Tsang Memorial'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '09:00',
      closing_time: '17:00',
      entry_fee_inr: 40,
      nearest_airport: 'Patna Airport (PAT)',
      nearest_railway: 'Rajgir Railway Station'
    }
  },

  // ----------------------------------------------------------------------------
  // CHHATTISGARH
  // ----------------------------------------------------------------------------
  {
    id: 'chitrakote-falls-chhattisgarh',
    name: 'Chitrakote Falls',
    aliases: ['Niagara of India', 'Chitrakoot Waterfalls'],
    state: 'Chhattisgarh',
    district: 'Bastar',
    city: 'Jagdalpur',
    latitude: 19.2019,
    longitude: 81.7058,
    category: 'waterfall',
    description:
      'Widest natural waterfall in India spanning nearly 300 meters on the Indravati River, plunging 95 feet in a horseshoe curve surrounded by Bastar woodlands.',
    tourism_tags: ['natural_attraction', 'waterfall', 'niagara_of_india', 'bastar_tribal_belt', 'scenic'],
    nearby_attractions: ['Tirathgarh Falls', 'Kanger Valley National Park', 'Kutumsar Caves'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'NATMO',
      details: { natmo_theme: 'Waterfalls & Ecotourism' }
    },
    operational: {
      best_time_to_visit: 'July to December (Peak in Monsoon)',
      ideal_duration_hours: 3,
      opening_time: '06:00',
      closing_time: '18:30',
      entry_fee_inr: 0,
      nearest_airport: 'Jagdalpur Airport (JGB) / Raipur (RPR)',
      nearest_railway: 'Jagdalpur Railway Station'
    }
  },

  // ----------------------------------------------------------------------------
  // GOA
  // ----------------------------------------------------------------------------
  {
    id: 'basilica-of-bom-jesus-old-goa',
    name: 'Basilica of Bom Jesus',
    aliases: ['Old Goa Church', 'Borea Jezuchi Bajilika'],
    state: 'Goa',
    district: 'North Goa',
    city: 'Old Goa (Velha Goa)',
    latitude: 15.5009,
    longitude: 73.9116,
    category: 'historical_monument',
    description:
      'UNESCO World Heritage 16th-century Baroque basilica housing the sacred relics of St. Francis Xavier, featuring unplastered red laterite facade.',
    tourism_tags: ['unesco_world_heritage', 'baroque_architecture', 'portuguese_colonial', 'spiritual'],
    nearby_attractions: ['Se Cathedral', 'Church of St. Francis of Assisi', 'Church of St. Cajetan'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Goa Heritage Circuit' }
    },
    operational: {
      best_time_to_visit: 'November to February',
      ideal_duration_hours: 1.5,
      opening_time: '09:00',
      closing_time: '18:30',
      entry_fee_inr: 0,
      nearest_airport: 'Dabolim Airport (GOI) / Mopa (GOX)',
      nearest_railway: 'Karmali Railway Station (KRMI)'
    }
  },
  {
    id: 'fort-aguada-sinquerim-goa',
    name: 'Fort Aguada & Lighthouse',
    aliases: ['Aguada Fort'],
    state: 'Goa',
    district: 'North Goa',
    city: 'Candolim',
    latitude: 15.4921,
    longitude: 73.7736,
    category: 'fort',
    description:
      'Imposing 17th-century Portuguese fortress and freshwater reservoir guarding the Mandovi River confluence, with panoramic views of the Arabian Sea.',
    tourism_tags: ['portuguese_fortress', 'lighthouse', 'sea_view', 'sunset_point', 'historical_heritage'],
    nearby_attractions: ['Sinquerim Beach', 'Candolim Beach', 'Aguada Central Jail Museum'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'OpenStreetMap'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2,
      opening_time: '09:30',
      closing_time: '18:00',
      entry_fee_inr: 50,
      nearest_airport: 'Manohar International Airport, Mopa (GOX)',
      nearest_railway: 'Thivim (THVM)'
    }
  },
  {
    id: 'dudhsagar-falls-goa',
    name: 'Dudhsagar Waterfalls',
    aliases: ['Sea of Milk Waterfalls'],
    state: 'Goa',
    district: 'South Goa',
    city: 'Sanguem',
    latitude: 15.3144,
    longitude: 74.3143,
    category: 'waterfall',
    description:
      'Four-tiered cascading waterfall plunging 310 meters through the lush Western Ghats forest, famously traversed by an active railway viaduct.',
    tourism_tags: ['waterfall', 'trekking', 'jeep_safari', 'western_ghats', 'adventure'],
    nearby_attractions: ['Bhagwan Mahaveer Sanctuary', 'Tambdi Surla Temple', 'Mollem National Park'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'NATMO'
    },
    operational: {
      best_time_to_visit: 'October to February',
      ideal_duration_hours: 4,
      opening_time: '08:30',
      closing_time: '16:30',
      entry_fee_inr: 100,
      nearest_airport: 'Dabolim Airport (GOI)',
      nearest_railway: 'Kulem Railway Station'
    }
  },

  // ----------------------------------------------------------------------------
  // GUJARAT
  // ----------------------------------------------------------------------------
  {
    id: 'statue-of-unity-ekta-nagar-gujarat',
    name: 'Statue of Unity',
    aliases: ['Sardar Patel Memorial'],
    state: 'Gujarat',
    district: 'Narmada',
    city: 'Ekta Nagar (Kevadia)',
    latitude: 21.838,
    longitude: 73.7191,
    category: 'historical_monument',
    description:
      'The world\'s tallest statue rising 182 meters on the Narmada River, honoring Sardar Vallabhbhai Patel with high-speed viewing gallery at 153 meters.',
    tourism_tags: ['engineering_marvel', 'world_record', 'viewing_gallery', 'narmada_dam', 'laser_show'],
    nearby_attractions: ['Sardar Sarovar Dam', 'Valley of Flowers Gujarat', 'Jungle Safari Ekta Nagar'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Gujarat Modern Marvels Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 4,
      opening_time: '08:00',
      closing_time: '18:00',
      entry_fee_inr: 150,
      nearest_airport: 'Vadodara Airport (BDQ)',
      nearest_railway: 'Ekta Nagar Railway Station (EKNR)'
    }
  },
  {
    id: 'great-rann-of-kutch-gujarat',
    name: 'Great Rann of Kutch',
    aliases: ['White Desert', 'Rann Utsav Dhordo'],
    state: 'Gujarat',
    district: 'Kutch',
    city: 'Dhordo',
    latitude: 23.8333,
    longitude: 69.8333,
    category: 'natural_attraction',
    description:
      'Vast seasonal salt marsh desert spanning over 7,500 sq km, shimmering under full moon skies and hosting the vibrant three-month Rann Utsav festival.',
    tourism_tags: ['white_desert', 'full_moon_landscape', 'rann_utsav', 'handicrafts', 'cultural_fest'],
    nearby_attractions: ['Kalo Dungar (Black Hill)', 'Dholavira UNESCO Harappan City', 'Aina Mahal Bhuj'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Desert Circuit Gujarat' }
    },
    operational: {
      best_time_to_visit: 'November to February (Rann Utsav season)',
      ideal_duration_hours: 5,
      opening_time: '06:00',
      closing_time: '22:00',
      entry_fee_inr: 100,
      nearest_airport: 'Bhuj Airport (BHJ)',
      nearest_railway: 'Bhuj Railway Station'
    }
  },
  {
    id: 'gir-national-park-gujarat',
    name: 'Gir National Park & Wildlife Sanctuary',
    aliases: ['Sasan Gir'],
    state: 'Gujarat',
    district: 'Junagadh',
    city: 'Sasan Gir',
    latitude: 21.1243,
    longitude: 70.8242,
    category: 'national_park',
    description:
      'The only natural habitat of the endangered Asiatic Lion in the world, featuring dry deciduous teak forests, rocky hills, and open grasslands.',
    tourism_tags: ['asiatic_lion', 'wildlife_safari', 'biodiversity', 'ecotourism', 'teak_forest'],
    nearby_attractions: ['Devalia Safari Park', 'Somnath Temple', 'Uparkot Fort Junagadh'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'December to March',
      ideal_duration_hours: 4,
      opening_time: '06:00',
      closing_time: '17:00',
      entry_fee_inr: 150,
      nearest_airport: 'Keshod Airport (IXK) / Rajkot (RAJ)',
      nearest_railway: 'Junagadh Junction'
    }
  },

  // ----------------------------------------------------------------------------
  // HARYANA
  // ----------------------------------------------------------------------------
  {
    id: 'kurukshetra-brahma-sarovar-haryana',
    name: 'Brahma Sarovar & Kurukshetra Heritage',
    aliases: ['Kurukshetra Holy Lake', 'Dharmakshetra'],
    state: 'Haryana',
    district: 'Kurukshetra',
    city: 'Thanesar',
    latitude: 29.9695,
    longitude: 76.8406,
    category: 'pilgrimage_site',
    description:
      'Ancient sacred water tank and battlefield where the epic Mahabharata was fought and Lord Krishna delivered the Bhagavad Gita.',
    tourism_tags: ['mahabharata_heritage', 'bhagavad_gita', 'holy_lake', 'astronomical_museum', 'spiritual'],
    nearby_attractions: ['Jyotisar Birthplace of Gita', 'Sannihit Sarovar', 'Sheikh Chilli Tomb'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Krishna Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2.5,
      opening_time: '05:00',
      closing_time: '21:00',
      entry_fee_inr: 0,
      nearest_airport: 'Chandigarh Airport (IXC)',
      nearest_railway: 'Kurukshetra Junction (KKDE)'
    }
  },

  // ----------------------------------------------------------------------------
  // HIMACHAL PRADESH
  // ----------------------------------------------------------------------------
  {
    id: 'rohtang-pass-atal-tunnel-manali',
    name: 'Atal Tunnel & Rohtang Pass',
    aliases: ['Rohtang Snow Point', 'Atal Tunnel Rohtang'],
    state: 'Himachal Pradesh',
    district: 'Kullu',
    city: 'Manali',
    latitude: 32.3716,
    longitude: 77.1687,
    category: 'viewpoint',
    description:
      'High-altitude Himalayan pass at 13,058 feet alongside the world\'s longest highway tunnel above 10,000 feet, connecting Kullu with Lahaul Valley.',
    tourism_tags: ['snow_glacier', 'mountain_pass', 'high_altitude_tunnel', 'adventure', 'himalayas'],
    nearby_attractions: ['Solang Valley', 'Sissu Waterfall Lahaul', 'Hadimba Temple Manali'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'NATMO'
    },
    operational: {
      best_time_to_visit: 'May to October for Pass (Tunnel open year-round)',
      ideal_duration_hours: 5,
      opening_time: '06:00',
      closing_time: '17:00',
      entry_fee_inr: 0,
      nearest_airport: 'Bhuntar Airport, Kullu (KUU)',
      nearest_railway: 'Joginder Nagar / Chandigarh'
    }
  },
  {
    id: 'dharamshala-mcleodganj-tsuglagkhang',
    name: 'Tsuglagkhang Complex & McLeod Ganj',
    aliases: ['Dalai Lama Temple', 'Little Lhasa'],
    state: 'Himachal Pradesh',
    district: 'Kangra',
    city: 'Dharamshala',
    latitude: 32.2359,
    longitude: 76.3243,
    category: 'cultural_hub',
    description:
      'Official residence of the 14th Dalai Lama, featuring Tibetan prayer wheels, serene meditation halls, and the Kangra valley background.',
    tourism_tags: ['tibetan_culture', 'dalai_lama_temple', 'dhauladhar_mountains', 'monasteries', 'spiritual'],
    nearby_attractions: ['Bhagsunath Waterfall', 'Triund Trek Point', 'Namgyal Monastery'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'March to June & September to November',
      ideal_duration_hours: 3,
      opening_time: '05:00',
      closing_time: '20:00',
      entry_fee_inr: 0,
      nearest_airport: 'Kangra Airport, Gaggal (DHM)',
      nearest_railway: 'Pathankot Junction'
    }
  },

  // ----------------------------------------------------------------------------
  // JHARKHAND
  // ----------------------------------------------------------------------------
  {
    id: 'baidyanath-dham-deoghar-jharkhand',
    name: 'Baba Baidyanath Jyotirlinga Temple',
    aliases: ['Baidyanath Dham', 'Deoghar Temple'],
    state: 'Jharkhand',
    district: 'Deoghar',
    city: 'Deoghar',
    latitude: 24.4925,
    longitude: 86.7001,
    category: 'temple',
    description:
      'One of the 12 sacred Jyotirlingas in India, attracting millions of devotees during the sacred Shravani Mela with holy water from the Ganges.',
    tourism_tags: ['jyotirlinga', 'shiva_shrine', 'sacred_pilgrimage', 'shravani_mela', 'ancient_temple'],
    nearby_attractions: ['Trikut Pahar Ropeway', 'Tapovan Caves Deoghar', 'Naulakha Mandir'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Jyotirlinga Pilgrimage Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '04:00',
      closing_time: '21:00',
      entry_fee_inr: 0,
      nearest_airport: 'Deoghar Airport (DGH)',
      nearest_railway: 'Jasidih Junction (JSME)'
    }
  },

  // ----------------------------------------------------------------------------
  // KARNATAKA
  // ----------------------------------------------------------------------------
  {
    id: 'hampi-vijayanagara-ruins-karnataka',
    name: 'Group of Monuments at Hampi',
    aliases: ['Hampi Ruins', 'Vijayanagara Empire Capital'],
    state: 'Karnataka',
    district: 'Vijayanagara',
    city: 'Hampi',
    latitude: 15.335,
    longitude: 76.46,
    category: 'historical_monument',
    description:
      'UNESCO World Heritage Site with monumental Dravidian ruins, musical pillars at Vitthala Temple, royal stone chariot, and boulder-strewn landscapes.',
    tourism_tags: ['unesco_world_heritage', 'stone_chariot', 'vijayanagara_empire', 'dravidian_craft', 'boulders'],
    nearby_attractions: ['Virupaksha Temple', 'Lotus Mahal', 'Matanga Hill Sunrise', 'Tungabhadra River'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Karnataka Heritage Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to February',
      ideal_duration_hours: 6,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 40,
      nearest_airport: 'Jindal Vidyanagar Airport (VDY) / Hubballi (HBX)',
      nearest_railway: 'Hosapete Junction (HPT)'
    }
  },
  {
    id: 'mysore-palace-karnataka',
    name: 'Mysore Palace (Amba Vilas)',
    aliases: ['Mysuru Palace', 'Amba Vilas Palace'],
    state: 'Karnataka',
    district: 'Mysuru',
    city: 'Mysuru',
    latitude: 12.3052,
    longitude: 76.6552,
    category: 'heritage_palace',
    description:
      'Indo-Saracenic royal residence of the Wadiyar dynasty, illuminated by nearly 100,000 bulbs on Sundays and during Dasara festivities.',
    tourism_tags: ['royal_palace', 'indo_saracenic', 'illuminated_palace', 'dasara_festival', 'heritage'],
    nearby_attractions: ['Chamundi Hills', 'Brindavan Gardens', 'St. Philomena Cathedral'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'September to March',
      ideal_duration_hours: 2.5,
      opening_time: '10:00',
      closing_time: '17:30',
      entry_fee_inr: 100,
      nearest_airport: 'Mysore Airport (MYQ) / Bengaluru (BLR)',
      nearest_railway: 'Mysore Junction (MYS)'
    }
  },

  // ----------------------------------------------------------------------------
  // KERALA
  // ----------------------------------------------------------------------------
  {
    id: 'alleppey-backwaters-houseboats-kerala',
    name: 'Alappuzha (Alleppey) Backwaters',
    aliases: ['Venice of the East', 'Alleppey Houseboat Circuit'],
    state: 'Kerala',
    district: 'Alappuzha',
    city: 'Alappuzha',
    latitude: 9.4981,
    longitude: 76.3388,
    category: 'natural_attraction',
    description:
      'Serene network of interconnected canals, lagoons, and Vembanad Lake traversed by traditional Kettuvallam houseboats past paddy fields and villages.',
    tourism_tags: ['backwaters', 'houseboat_cruise', 'vembanad_lake', 'scenic_waterways', 'ayurveda'],
    nearby_attractions: ['Marari Beach', 'Vembanad Lake', 'Kumarakom Bird Sanctuary'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Kerala Backwater Circuit' }
    },
    operational: {
      best_time_to_visit: 'September to March',
      ideal_duration_hours: 6,
      opening_time: '06:00',
      closing_time: '20:00',
      entry_fee_inr: 0,
      nearest_airport: 'Cochin International Airport (COK)',
      nearest_railway: 'Alappuzha Railway Station (ALLP)'
    }
  },
  {
    id: 'munnar-tea-gardens-kerala',
    name: 'Munnar Tea Plantations & Eravikulam',
    aliases: ['Munnar Hill Station', 'Eravikulam National Park'],
    state: 'Kerala',
    district: 'Idukki',
    city: 'Munnar',
    latitude: 10.0889,
    longitude: 77.0595,
    category: 'hill_station',
    description:
      'Picturesque hill retreat at 5,200 feet carpeted in manicured tea estates, home to the endangered Nilgiri Tahr and South India\'s highest peak, Anamudi.',
    tourism_tags: ['tea_plantations', 'nilgiri_tahr', 'hill_station', 'western_ghats', 'anamudi_peak'],
    nearby_attractions: ['Mattupetty Dam', 'Echo Point Munnar', 'Top Station Viewpoint'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'September to April',
      ideal_duration_hours: 4,
      opening_time: '07:30',
      closing_time: '16:00',
      entry_fee_inr: 200,
      nearest_airport: 'Cochin International Airport (COK)',
      nearest_railway: 'Aluva / Ernakulam'
    }
  },
  {
    id: 'fort-kochi-chinese-fishing-nets',
    name: 'Fort Kochi & Chinese Fishing Nets',
    aliases: ['Old Kochi Port', 'Mattancherry Jewish Quarter'],
    state: 'Kerala',
    district: 'Ernakulam',
    city: 'Kochi',
    latitude: 9.9658,
    longitude: 76.2427,
    category: 'cultural_hub',
    description:
      'Historic spice-trading harbor with iconic cantilevered 14th-century Chinese fishing nets, Portuguese Santa Cruz Basilica, and Jewish Synagogue in Mattancherry.',
    tourism_tags: ['chinese_fishing_nets', 'portuguese_colonial', 'spice_market', 'jew_town', 'cultural_heritage'],
    nearby_attractions: ['Mattancherry Dutch Palace', 'Paradesi Synagogue', 'Kochi Beach'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Malabar Coast Heritage' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '06:00',
      closing_time: '21:00',
      entry_fee_inr: 0,
      nearest_airport: 'Cochin International Airport (COK)',
      nearest_railway: 'Ernakulam Junction (ERS)'
    }
  },
  {
    id: 'kovalam-lighthouse-beach-kerala',
    name: 'Kovalam Lighthouse Beach & Crescent Bay',
    aliases: ['Kovalam Beach', 'Vizhinjam Lighthouse'],
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    city: 'Kovalam',
    latitude: 8.3988,
    longitude: 76.9785,
    category: 'beach',
    description:
      'Internationally acclaimed crescent-shaped coastline with golden sands, shallow tidal shelves, ayurvedic coastal wellness resorts, and the 1972 red-and-white striped Vizhinjam Lighthouse.',
    tourism_tags: ['beach', 'lighthouse', 'ayurvedic_resorts', 'arabian_sea', 'sunset_viewpoint'],
    nearby_attractions: ['Hawa Beach', 'Samudra Beach', 'Padmanabhaswamy Temple Trivandrum'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Coastal Kerala Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3.5,
      opening_time: '06:00',
      closing_time: '20:00',
      entry_fee_inr: 0,
      nearest_airport: 'Trivandrum International Airport (TRV)',
      nearest_railway: 'Thiruvananthapuram Central (TVC)'
    }
  },

  // ----------------------------------------------------------------------------
  // MADHYA PRADESH
  // ----------------------------------------------------------------------------
  {
    id: 'khajuraho-group-of-monuments-mp',
    name: 'Khajuraho Group of Monuments',
    aliases: ['Khajuraho Temples', 'Kandariya Mahadeva'],
    state: 'Madhya Pradesh',
    district: 'Chhatarpur',
    city: 'Khajuraho',
    latitude: 24.8318,
    longitude: 79.9199,
    category: 'historical_monument',
    description:
      'UNESCO World Heritage Site renowned for Nagara-style architectural brilliance and intricate sculptural friezes celebrating human life and spirituality.',
    tourism_tags: ['unesco_world_heritage', 'nagara_temple', 'sculptural_art', 'chandela_dynasty', 'heritage'],
    nearby_attractions: ['Panna National Park', 'Raneh Falls Canyon', 'Western Group of Temples'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Bundelkhand Heritage Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 4,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 40,
      nearest_airport: 'Khajuraho Airport (HJR)',
      nearest_railway: 'Khajuraho Railway Station (KURJ)'
    }
  },
  {
    id: 'kanha-tiger-reserve-mp',
    name: 'Kanha Tiger Reserve',
    aliases: ['Kanha National Park', 'Jungle Book Wilderness'],
    state: 'Madhya Pradesh',
    district: 'Mandla',
    city: 'Mandla',
    latitude: 22.3345,
    longitude: 80.6115,
    category: 'national_park',
    description:
      'Premier tiger reserve whose sal forests and vast meadows inspired Rudyard Kipling\'s The Jungle Book, sanctuary to the rare hard-ground swamp deer (Barasingha).',
    tourism_tags: ['bengal_tiger', 'wildlife_safari', 'barasingha', 'jungle_book', 'biodiversity'],
    nearby_attractions: ['Bandhavgarh National Park', 'Bamni Dadar Sunset Point', 'Mukki Gate'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'October to May',
      ideal_duration_hours: 5,
      opening_time: '06:00',
      closing_time: '17:30',
      entry_fee_inr: 250,
      nearest_airport: 'Jabalpur Airport (JLR)',
      nearest_railway: 'Gondia / Jabalpur'
    }
  },

  // ----------------------------------------------------------------------------
  // MAHARASHTRA
  // ----------------------------------------------------------------------------
  {
    id: 'ajanta-ellora-caves-maharashtra',
    name: 'Ajanta & Ellora Caves',
    aliases: ['Verul Leni', 'Kailash Temple Ellora'],
    state: 'Maharashtra',
    district: 'Chhatrapati Sambhajinagar (Aurangabad)',
    city: 'Chhatrapati Sambhajinagar',
    latitude: 20.0264,
    longitude: 75.1793,
    category: 'historical_monument',
    description:
      'Twin UNESCO World Heritage rock-cut cave monuments featuring ancient Buddhist murals (Ajanta) and the world\'s largest monolithic rock-hewn temple (Kailash at Ellora).',
    tourism_tags: ['unesco_world_heritage', 'rock_cut_caves', 'kailash_monolith', 'buddhist_frescoes', 'ancient_india'],
    nearby_attractions: ['Bibi Ka Maqbara', 'Daulatabad Fort', 'Grishneshwar Jyotirlinga'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 6,
      opening_time: '09:00',
      closing_time: '17:30',
      entry_fee_inr: 40,
      nearest_airport: 'Aurangabad Airport (IXU)',
      nearest_railway: 'Aurangabad Railway Station'
    }
  },
  {
    id: 'gateway-of-india-marine-drive-mumbai',
    name: 'Gateway of India & Marine Drive',
    aliases: ['Queen\'s Necklace', 'Apollo Bunder'],
    state: 'Maharashtra',
    district: 'Mumbai City',
    city: 'Mumbai',
    latitude: 18.922,
    longitude: 72.8347,
    category: 'historical_monument',
    description:
      'Iconic 26-meter Indo-Saracenic arch overlooking Mumbai Harbor, alongside the sweeping seaside crescent promenade of Marine Drive.',
    tourism_tags: ['colonial_monument', 'harbor_view', 'marine_drive', 'promenade', 'iconic_cityscape'],
    nearby_attractions: ['Taj Mahal Palace Hotel', 'Elephanta Caves UNESCO', 'Chhatrapati Shivaji Maharaj Terminus'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'OpenStreetMap'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2,
      opening_time: '00:00',
      closing_time: '23:59',
      entry_fee_inr: 0,
      nearest_airport: 'Chhatrapati Shivaji Maharaj International (BOM)',
      nearest_railway: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)'
    }
  },

  // ----------------------------------------------------------------------------
  // MANIPUR
  // ----------------------------------------------------------------------------
  {
    id: 'loktak-lake-keibul-lamjao-manipur',
    name: 'Loktak Lake & Keibul Lamjao National Park',
    aliases: ['Floating Lake Manipur', 'Sangai Deer Park'],
    state: 'Manipur',
    district: 'Bishnupur',
    city: 'Moirang',
    latitude: 24.55,
    longitude: 93.8167,
    category: 'lake',
    description:
      'The largest freshwater lake in Northeast India, famed for round floating biomass islands called "phumdis" and the world\'s only floating national park.',
    tourism_tags: ['floating_lake', 'keibul_lamjao', 'sangai_deer', 'ramsar_wetland', 'ecotourism'],
    nearby_attractions: ['INA War Memorial Moirang', 'Sendra Island', 'Kangla Fort Imphal'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'NATMO',
      details: { natmo_theme: 'Unique Wetland Ecosystems' }
    },
    operational: {
      best_time_to_visit: 'November to April',
      ideal_duration_hours: 4,
      opening_time: '06:00',
      closing_time: '17:00',
      entry_fee_inr: 50,
      nearest_airport: 'Bir Tikendrajit International, Imphal (IMF)',
      nearest_railway: 'Silchar / Dimapur'
    }
  },

  // ----------------------------------------------------------------------------
  // MEGHALAYA
  // ----------------------------------------------------------------------------
  {
    id: 'double-decker-root-bridge-cherrapunji',
    name: 'Double Decker Living Root Bridge',
    aliases: ['Umshiang Double Decker Bridge', 'Sohra Living Root Bridges'],
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    city: 'Cherrapunji (Sohra)',
    latitude: 25.2345,
    longitude: 91.6789,
    category: 'natural_attraction',
    description:
      'Extraordinary two-tier living root bridge bio-engineered over centuries by Khasi tribesmen using the aerial roots of Ficus elastica trees.',
    tourism_tags: ['living_root_bridges', 'bio_engineering', 'trekking', 'khasi_hills', 'cloud_forest'],
    nearby_attractions: ['Nohkalikai Falls', 'Mawsmai Cave', 'Seven Sisters Falls'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Meghalaya Nature Circuit' }
    },
    operational: {
      best_time_to_visit: 'September to May',
      ideal_duration_hours: 5,
      opening_time: '06:00',
      closing_time: '17:00',
      entry_fee_inr: 50,
      nearest_airport: 'Shillong Airport, Umroi (SHL) / Guwahati (GAU)',
      nearest_railway: 'Guwahati (GHY)'
    }
  },
  {
    id: 'dawki-umngot-river-meghalaya',
    name: 'Dawki (Umngot River)',
    aliases: ['Transparent River Dawki'],
    state: 'Meghalaya',
    district: 'West Jaintia Hills',
    city: 'Dawki',
    latitude: 25.1833,
    longitude: 92.0167,
    category: 'natural_attraction',
    description:
      'Famous crystal-clear river along the India-Bangladesh border where wooden country boats appear to float in mid-air above pebble riverbeds.',
    tourism_tags: ['crystal_clear_water', 'boating', 'border_town', 'scenic_river', 'camping'],
    nearby_attractions: ['Mawlynnong Cleanest Village', 'Shnongpdeng Adventure Camp', 'Krang Shuri Falls'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'NATMO'
    },
    operational: {
      best_time_to_visit: 'November to April (Maximum clarity)',
      ideal_duration_hours: 3,
      opening_time: '07:00',
      closing_time: '17:30',
      entry_fee_inr: 0,
      nearest_airport: 'Guwahati (GAU) / Shillong (SHL)',
      nearest_railway: 'Guwahati'
    }
  },

  // ----------------------------------------------------------------------------
  // MIZORAM
  // ----------------------------------------------------------------------------
  {
    id: 'vantawng-falls-mizoram',
    name: 'Vantawng Falls & Thenzawl',
    aliases: ['Vantawng Khawhthla'],
    state: 'Mizoram',
    district: 'Serchhip',
    city: 'Thenzawl',
    latitude: 23.2842,
    longitude: 92.7483,
    category: 'waterfall',
    description:
      'Highest uninterrupted waterfall in Mizoram cascading 750 feet down sheer cliffs encircled by dense bamboo groves in Serchhip district.',
    tourism_tags: ['waterfall', 'bamboo_forest', 'serene', 'mizo_weaving', 'nature'],
    nearby_attractions: ['Thenzawl Deer Park', 'Tuirihiau Falls', 'Reiek Heritage Village'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'September to January',
      ideal_duration_hours: 2.5,
      opening_time: '07:00',
      closing_time: '17:00',
      entry_fee_inr: 20,
      nearest_airport: 'Lengpui Airport, Aizawl (AJL)',
      nearest_railway: 'Bairabi / Silchar'
    }
  },

  // ----------------------------------------------------------------------------
  // NAGALAND
  // ----------------------------------------------------------------------------
  {
    id: 'dzukou-valley-nagaland',
    name: 'Dzukou Valley',
    aliases: ['Valley of Flowers of the East'],
    state: 'Nagaland',
    district: 'Kohima',
    city: 'Kohima',
    latitude: 25.5667,
    longitude: 94.0667,
    category: 'viewpoint',
    description:
      'Breathtaking high-altitude valley sitting at 8,000 feet on the Nagaland-Manipur border, famous for seasonal blooms of endemic Dzukou lilies.',
    tourism_tags: ['trekking', 'endemic_flowers', 'rolling_hills', 'pristine_wilderness', 'camping'],
    nearby_attractions: ['Kohima War Cemetery', 'Kisama Heritage Village', 'Khonoma Green Village'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'June to September for flowers; October to March for trekking',
      ideal_duration_hours: 6,
      opening_time: '05:00',
      closing_time: '18:00',
      entry_fee_inr: 50,
      nearest_airport: 'Dimapur Airport (DMU)',
      nearest_railway: 'Dimapur Railway Station'
    }
  },

  // ----------------------------------------------------------------------------
  // ODISHA
  // ----------------------------------------------------------------------------
  {
    id: 'konark-sun-temple-odisha',
    name: 'Konark Sun Temple',
    aliases: ['Black Pagoda', 'Surya Deula Konark'],
    state: 'Odisha',
    district: 'Puri',
    city: 'Konark',
    latitude: 19.8876,
    longitude: 86.0945,
    category: 'historical_monument',
    description:
      '13th-century UNESCO World Heritage monumental temple conceived as a gigantic 24-wheeled chariot of Surya the Sun God pulled by seven carved horses.',
    tourism_tags: ['unesco_world_heritage', 'sun_temple', 'chariot_architecture', 'kalinga_art', 'ancient_astronomy'],
    nearby_attractions: ['Chandrabhaga Beach', 'Puri Jagannath Temple', 'Chilika Lake'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Odisha Golden Triangle' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '06:00',
      closing_time: '20:00',
      entry_fee_inr: 40,
      nearest_airport: 'Biju Patnaik International, Bhubaneswar (BBI)',
      nearest_railway: 'Puri Railway Station (PURI)'
    }
  },
  {
    id: 'jagannath-temple-puri-odisha',
    name: 'Shree Jagannath Temple, Puri',
    aliases: ['Puri Dham', 'Badadeula'],
    state: 'Odisha',
    district: 'Puri',
    city: 'Puri',
    latitude: 19.8049,
    longitude: 85.8179,
    category: 'temple',
    description:
      'One of the Char Dham pilgrimage sites, famous for its magnificent 65-meter spire, sacred Mahaprasad kitchen, and the world-renowned Ratha Yatra chariot festival.',
    tourism_tags: ['char_dham', 'ratha_yatra', 'sacred_pilgrimage', 'kalinga_architecture', 'spiritual'],
    nearby_attractions: ['Golden Beach Puri (Blue Flag)', 'Gundicha Temple', 'Raghurajpur Heritage Craft Village'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '05:30',
      closing_time: '22:00',
      entry_fee_inr: 0,
      nearest_airport: 'Bhubaneswar Airport (BBI)',
      nearest_railway: 'Puri Railway Station (PURI)'
    }
  },

  // ----------------------------------------------------------------------------
  // PUNJAB
  // ----------------------------------------------------------------------------
  {
    id: 'golden-temple-amritsar-punjab',
    name: 'Sri Harmandir Sahib (Golden Temple)',
    aliases: ['Darbar Sahib Amritsar', 'Golden Temple'],
    state: 'Punjab',
    district: 'Amritsar',
    city: 'Amritsar',
    latitude: 31.62,
    longitude: 74.8765,
    category: 'temple',
    description:
      'Holiest Gurdwara of Sikhism plated with pure gold leaf and surrounded by the sacred Amrit Sarovar lake, serving free meals (Langar) to over 100,000 pilgrims daily.',
    tourism_tags: ['sikh_holy_shrine', 'golden_architecture', 'holy_sarovar', 'mega_langar', 'peace_and_equality'],
    nearby_attractions: ['Jallianwala Bagh', 'Wagah Border Ceremony', 'Partition Museum'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Punjab Heritage & Spiritual Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 4,
      opening_time: '03:00',
      closing_time: '23:00',
      entry_fee_inr: 0,
      nearest_airport: 'Sri Guru Ram Dass Jee International, Amritsar (ATQ)',
      nearest_railway: 'Amritsar Junction (ASR)'
    }
  },
  {
    id: 'wagah-border-amritsar-punjab',
    name: 'Attari-Wagah Border Ceremony',
    aliases: ['Wagah Border Beating Retreat'],
    state: 'Punjab',
    district: 'Amritsar',
    city: 'Attari',
    latitude: 31.6047,
    longitude: 74.5714,
    category: 'cultural_hub',
    description:
      'Electrifying daily military parade and flag-lowering ceremony conducted with high kicks and synchronized precision by the Border Security Force (BSF) and Pakistan Rangers.',
    tourism_tags: ['patriotic_ceremony', 'international_border', 'bsf_parade', 'military_pomp'],
    nearby_attractions: ['Golden Temple', 'Gobindgarh Fort Amritsar', 'War Memorial Amritsar'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '15:30',
      closing_time: '18:30',
      entry_fee_inr: 0,
      nearest_airport: 'Amritsar Airport (ATQ)',
      nearest_railway: 'Amritsar Junction (ASR)'
    }
  },

  // ----------------------------------------------------------------------------
  // RAJASTHAN
  // ----------------------------------------------------------------------------
  {
    id: 'amber-palace-fort-jaipur-rajasthan',
    name: 'Amber (Amer) Palace & Fort',
    aliases: ['Amer Fort Jaipur'],
    state: 'Rajasthan',
    district: 'Jaipur',
    city: 'Jaipur',
    latitude: 26.9855,
    longitude: 75.8513,
    category: 'fort',
    description:
      'UNESCO World Heritage majestic Rajput hill fort overlooking Maota Lake, famous for Sheesh Mahal (Palace of Mirrors) and grand marble courtyards.',
    tourism_tags: ['unesco_world_heritage', 'rajput_fortress', 'sheesh_mahal', 'hill_forts_rajasthan', 'royal_heritage'],
    nearby_attractions: ['Jaigarh Fort (World\'s largest cannon)', 'Nahargarh Fort', 'Jal Mahal Jaipur'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Golden Triangle Rajasthan' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3.5,
      opening_time: '08:00',
      closing_time: '17:30',
      entry_fee_inr: 100,
      nearest_airport: 'Jaipur International Airport (JAI)',
      nearest_railway: 'Jaipur Junction (JP)'
    }
  },
  {
    id: 'city-palace-lake-pichola-udaipur',
    name: 'Udaipur City Palace & Lake Pichola',
    aliases: ['Udaipur Palace', 'Venice of the East City Palace'],
    state: 'Rajasthan',
    district: 'Udaipur',
    city: 'Udaipur',
    latitude: 24.5764,
    longitude: 73.6835,
    category: 'heritage_palace',
    description:
      'Magnificent Mewar royal palace complex blending Rajasthani and Mughal architecture, perched above the placid waters of Lake Pichola.',
    tourism_tags: ['royal_palace', 'lake_pichola', 'mewar_dynasty', 'boat_cruise', 'romantic_city'],
    nearby_attractions: ['Jag Mandir Island', 'Jagdish Temple', 'Saheliyon-ki-Bari'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '09:00',
      closing_time: '17:30',
      entry_fee_inr: 300,
      nearest_airport: 'Maharana Pratap Airport, Udaipur (UDR)',
      nearest_railway: 'Udaipur City (UDZ)'
    }
  },
  {
    id: 'hawa-mahal-jantar-mantar-jaipur',
    name: 'Hawa Mahal & Jantar Mantar',
    aliases: ['Palace of Winds', 'Jaipur Jantar Mantar UNESCO'],
    state: 'Rajasthan',
    district: 'Jaipur',
    city: 'Jaipur',
    latitude: 26.9239,
    longitude: 75.8267,
    category: 'historical_monument',
    description:
      'Five-storey pink sandstone honeycomb facade with 953 jharokhas built for royal ladies to observe street festivals, paired with Sawai Jai Singh II\'s UNESCO astronomical observatory.',
    tourism_tags: ['unesco_world_heritage', 'hawa_mahal', 'jantar_mantar', 'pink_city', 'astronomical_observatory'],
    nearby_attractions: ['City Palace Jaipur', 'Bapu Bazaar', 'Johari Bazaar'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Golden Triangle' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2.5,
      opening_time: '09:00',
      closing_time: '17:00',
      entry_fee_inr: 50,
      nearest_airport: 'Jaipur International Airport (JAI)',
      nearest_railway: 'Jaipur Junction (JP)'
    }
  },
  {
    id: 'mehrangarh-fort-jaswant-thada-jodhpur',
    name: 'Mehrangarh Fort & Jaswant Thada',
    aliases: ['Jodhpur Blue City Citadel', 'Mehran Fort'],
    state: 'Rajasthan',
    district: 'Jodhpur',
    city: 'Jodhpur',
    latitude: 26.2978,
    longitude: 73.0185,
    category: 'fort',
    description:
      'Imposing 15th-century cliffside fortress towering 400 feet above the Blue City of Jodhpur, housing palatial courtyards, royal palanquins, armory, and the white marble cenotaph of Jaswant Thada.',
    tourism_tags: ['blue_city', 'rathore_dynasty', 'hill_fort', 'sheesh_mahal', 'rajasthan_heritage'],
    nearby_attractions: ['Umaid Bhawan Palace', 'Clock Tower & Sardar Market', 'Mandore Gardens'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Desert Triangle Rajasthan' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3.5,
      opening_time: '09:00',
      closing_time: '17:00',
      entry_fee_inr: 100,
      nearest_airport: 'Jodhpur Airport (JDH)',
      nearest_railway: 'Jodhpur Junction (JU)'
    }
  },
  {
    id: 'jaisalmer-golden-fort-desert-safari',
    name: 'Jaisalmer Golden Fort (Sonar Qila) & Thar Dunes',
    aliases: ['Sonar Qila', 'Golden City Fort'],
    state: 'Rajasthan',
    district: 'Jaisalmer',
    city: 'Jaisalmer',
    latitude: 26.9124,
    longitude: 70.9127,
    category: 'fort',
    description:
      'UNESCO living sandstone fortress with a quarter of the old city\'s population residing within its walls, flanked by the sweeping golden sand dunes of Sam in the Thar Desert.',
    tourism_tags: ['unesco_world_heritage', 'living_fort', 'thar_desert', 'camel_safari', 'sand_dunes'],
    nearby_attractions: ['Patwon Ki Haveli', 'Gadisar Lake', 'Sam Sand Dunes'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Desert Circuit' }
    },
    operational: {
      best_time_to_visit: 'November to February',
      ideal_duration_hours: 4,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 50,
      nearest_airport: 'Jaisalmer Airport (JSA)',
      nearest_railway: 'Jaisalmer Railway Station (JSM)'
    }
  },
  {
    id: 'ranthambore-national-park-tiger-reserve',
    name: 'Ranthambore National Park & Fort',
    aliases: ['Ranthambhore Tiger Sanctuary', 'Ranthambore UNESCO Fort'],
    state: 'Rajasthan',
    district: 'Sawai Madhopur',
    city: 'Sawai Madhopur',
    latitude: 26.0173,
    longitude: 76.5026,
    category: 'national_park',
    description:
      'Premier Royal Bengal tiger reserve in the shadow of the 10th-century UNESCO Ranthambore Fort, characterized by dhok deciduous forests, marsh crocodiles, and ancient ruins.',
    tourism_tags: ['bengal_tigers', 'safari', 'unesco_world_heritage', 'wildlife_sanctuary', 'project_tiger'],
    nearby_attractions: ['Ranthambore Fort', 'Padam Talao Lake', 'Kachida Valley'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Wild Wildlife India' }
    },
    operational: {
      best_time_to_visit: 'October to April',
      ideal_duration_hours: 4,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 800,
      nearest_airport: 'Jaipur International Airport (JAI)',
      nearest_railway: 'Sawai Madhopur Junction (SWM)'
    }
  },

  // ----------------------------------------------------------------------------
  // SIKKIM
  // ----------------------------------------------------------------------------
  {
    id: 'tsomgo-lake-nathula-pass-sikkim',
    name: 'Tsomgo (Changu) Lake & Nathu La Pass',
    aliases: ['Changu Lake', 'Nathula Indo-China Border'],
    state: 'Sikkim',
    district: 'Gangtok',
    city: 'Gangtok',
    latitude: 27.3742,
    longitude: 88.7619,
    category: 'lake',
    description:
      'Sacred glacial alpine lake at 12,310 feet reflecting snow-clad peaks, leading up to the historic Silk Route mountain pass at Nathu La on the Indo-China frontier.',
    tourism_tags: ['glacial_lake', 'high_altitude_pass', 'indo_china_border', 'yak_rides', 'himalayas'],
    nearby_attractions: ['Baba Harbhajan Singh Mandir', 'Rumtek Monastery', 'MG Marg Gangtok'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Sikkim Himalayan Circuit' }
    },
    operational: {
      best_time_to_visit: 'March to May & October to December',
      ideal_duration_hours: 5,
      opening_time: '07:30',
      closing_time: '15:00',
      entry_fee_inr: 200,
      nearest_airport: 'Pakyong Airport (PYG) / Bagdogra (IXB)',
      nearest_railway: 'New Jalpaiguri (NJP)'
    }
  },

  // ----------------------------------------------------------------------------
  // TAMIL NADU
  // ----------------------------------------------------------------------------
  {
    id: 'meenakshi-amman-temple-madurai',
    name: 'Meenakshi Sundareswarar Temple',
    aliases: ['Madurai Meenakshi Temple'],
    state: 'Tamil Nadu',
    district: 'Madurai',
    city: 'Madurai',
    latitude: 9.9195,
    longitude: 78.1193,
    category: 'temple',
    description:
      'Colossal Dravidian temple complex spanning 14 acres with 14 towering gopurams encrusted in thousands of polychrome mythological sculptures.',
    tourism_tags: ['dravidian_architecture', 'soaring_gopuram', 'hall_of_thousand_pillars', 'ancient_city', 'shakti_shrine'],
    nearby_attractions: ['Thirumalai Nayakkar Mahal', 'Gandhi Memorial Museum Madurai', 'Vandiyur Mariamman Teppakulam'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Tamil Nadu Temple Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3.5,
      opening_time: '05:00',
      closing_time: '22:00',
      entry_fee_inr: 0,
      nearest_airport: 'Madurai International Airport (IXM)',
      nearest_railway: 'Madurai Junction (MDU)'
    }
  },
  {
    id: 'brihadeeswarar-temple-thanjavur',
    name: 'Brihadisvara (Big) Temple, Thanjavur',
    aliases: ['Peruvudaiyar Kovil', 'Thanjavur Big Temple'],
    state: 'Tamil Nadu',
    district: 'Thanjavur',
    city: 'Thanjavur',
    latitude: 10.7828,
    longitude: 79.1318,
    category: 'temple',
    description:
      'UNESCO World Heritage 11th-century Chola granite architectural masterpiece with a 66-meter vimana capped by an 80-tonne single granite monolith.',
    tourism_tags: ['unesco_world_heritage', 'great_living_chola_temples', 'granite_vimana', 'chola_bronze', 'ancient'],
    nearby_attractions: ['Thanjavur Royal Palace', 'Saraswathi Mahal Library', 'Gangaikonda Cholapuram'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2.5,
      opening_time: '06:00',
      closing_time: '20:30',
      entry_fee_inr: 0,
      nearest_airport: 'Tiruchirappalli International Airport (TRZ)',
      nearest_railway: 'Thanjavur Junction (TJ)'
    }
  },
  {
    id: 'mahabalipuram-shore-temple-tamilnadu',
    name: 'Group of Monuments at Mahabalipuram',
    aliases: ['Mamallapuram Shore Temple', 'Pancha Rathas'],
    state: 'Tamil Nadu',
    district: 'Chengalpattu',
    city: 'Mahabalipuram',
    latitude: 12.6167,
    longitude: 80.1944,
    category: 'historical_monument',
    description:
      '7th-century UNESCO World Heritage coastal Pallava monuments including Shore Temple, Pancha Rathas monolithic rock chariots, and Descent of the Ganges bas-relief.',
    tourism_tags: ['unesco_world_heritage', 'shore_temple', 'pallava_art', 'coastal_monuments', 'rock_cut_relief'],
    nearby_attractions: ['Krishna\'s Butterball', 'Arjuna\'s Penance', 'Covelong Beach'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'November to February',
      ideal_duration_hours: 3,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 40,
      nearest_airport: 'Chennai International Airport (MAA)',
      nearest_railway: 'Chengalpattu Junction'
    }
  },

  // ----------------------------------------------------------------------------
  // TELANGANA
  // ----------------------------------------------------------------------------
  {
    id: 'charminar-golconda-fort-hyderabad',
    name: 'Charminar & Golconda Fort',
    aliases: ['Charminar Monument', 'Golconda Diamond Fort'],
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    latitude: 17.3616,
    longitude: 78.4747,
    category: 'historical_monument',
    description:
      '16th-century grand four-minaret triumphal arch and medieval citadel world-renowned for acoustic engineering and historic Koh-i-Noor diamond trade.',
    tourism_tags: ['qutb_shahi', 'acoustic_engineering', 'bazaars', 'nizams_heritage', 'historic_fort'],
    nearby_attractions: ['Mecca Masjid', 'Chowmahalla Palace', 'Salar Jung Museum'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Deccan Heritage Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3.5,
      opening_time: '09:00',
      closing_time: '17:30',
      entry_fee_inr: 25,
      nearest_airport: 'Rajiv Gandhi International Airport (HYD)',
      nearest_railway: 'Hyderabad Deccan (HYB) / Secunderabad'
    }
  },
  {
    id: 'ramappa-temple-warangal-telangana',
    name: 'Kakatiya Rudreshwara (Ramappa) Temple',
    aliases: ['Ramappa Temple'],
    state: 'Telangana',
    district: 'Mulugu',
    city: 'Palampet',
    latitude: 18.2589,
    longitude: 79.9431,
    category: 'temple',
    description:
      'UNESCO World Heritage 13th-century Kakatiya temple constructed using unique floating bricks and intricately carved black basalt bracket figures.',
    tourism_tags: ['unesco_world_heritage', 'kakatiya_architecture', 'floating_bricks', 'sandstone_temple'],
    nearby_attractions: ['Ramappa Lake', 'Warangal Fort', 'Thousand Pillar Temple'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 25,
      nearest_airport: 'Hyderabad International Airport (HYD)',
      nearest_railway: 'Warangal Junction (WL)'
    }
  },

  // ----------------------------------------------------------------------------
  // TRIPURA
  // ----------------------------------------------------------------------------
  {
    id: 'neermahal-water-palace-tripura',
    name: 'Neermahal Water Palace',
    aliases: ['Twijulikma Lake Palace'],
    state: 'Tripura',
    district: 'Sipahijala',
    city: 'Melaghar',
    latitude: 23.5042,
    longitude: 91.3283,
    category: 'heritage_palace',
    description:
      'Eastern India\'s only lake water palace, constructed in 1930 in the middle of Rudrasagar Lake blending Hindu and Islamic architectural flourishes.',
    tourism_tags: ['lake_palace', 'water_fortress', 'boat_ride', 'rudrasagar_lake', 'manikya_dynasty'],
    nearby_attractions: ['Ujjayanta Palace Agartala', 'Sepahijala Wildlife Sanctuary', 'Tripura Sundari Temple Udaipur'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '09:00',
      closing_time: '17:00',
      entry_fee_inr: 50,
      nearest_airport: 'Maharaja Bir Bikram Airport, Agartala (IXA)',
      nearest_railway: 'Agartala Railway Station'
    }
  },

  // ----------------------------------------------------------------------------
  // UTTAR PRADESH
  // ----------------------------------------------------------------------------
  {
    id: 'taj-mahal-agra-uttar-pradesh',
    name: 'Taj Mahal',
    aliases: ['Crown of the Palace', 'Taj Mahal Agra'],
    state: 'Uttar Pradesh',
    district: 'Agra',
    city: 'Agra',
    latitude: 27.1751,
    longitude: 78.0421,
    category: 'historical_monument',
    description:
      'UNESCO World Heritage jewel of Muslim art in India and one of the New Seven Wonders of the World, constructed in white Makrana marble on the Yamuna River.',
    tourism_tags: ['unesco_world_heritage', 'seven_wonders', 'mughal_architecture', 'white_marble', 'pietra_dura'],
    nearby_attractions: ['Agra Fort UNESCO', 'Fatehpur Sikri UNESCO', 'Mehtab Bagh'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Golden Triangle' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '06:00',
      closing_time: '18:30',
      entry_fee_inr: 50,
      foreign_fee_inr: 1100,
      nearest_airport: 'Agra Airport (AGR) / Delhi (DEL)',
      nearest_railway: 'Agra Cantt (AGC)'
    }
  },
  {
    id: 'varanasi-ghats-kashi-vishwanath-up',
    name: 'Varanasi Ghats & Kashi Vishwanath Temple',
    aliases: ['Dashashwamedh Ghat', 'Banaras Riverfront'],
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    city: 'Varanasi',
    latitude: 25.3109,
    longitude: 83.0104,
    category: 'pilgrimage_site',
    description:
      'Continuously inhabited sacred city on the holy Ganges River, renowned for the Kashi Vishwanath Jyotirlinga, grand evening Ganga Aarti, and 84 historic stone ghats.',
    tourism_tags: ['spiritual_capital', 'ganga_aarti', 'jyotirlinga', 'sunrise_boat_ride', 'ancient_ghats'],
    nearby_attractions: ['Sarnath (Buddha\'s First Sermon)', 'Assi Ghat', 'Manikarnika Ghat', 'Banaras Hindu University'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Spiritual & Heritage Ganga Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 4,
      opening_time: '03:00',
      closing_time: '23:00',
      entry_fee_inr: 0,
      nearest_airport: 'Lal Bahadur Shastri International, Varanasi (VNS)',
      nearest_railway: 'Varanasi Junction (BSB) / Pt. Deen Dayal Upadhyaya'
    }
  },
  {
    id: 'fatehpur-sikri-uttar-pradesh',
    name: 'Fatehpur Sikri',
    aliases: ['City of Victory', 'Buland Darwaza Complex'],
    state: 'Uttar Pradesh',
    district: 'Agra',
    city: 'Fatehpur Sikri',
    latitude: 27.0944,
    longitude: 77.6678,
    category: 'historical_monument',
    description:
      'UNESCO World Heritage 16th-century Mughal red sandstone capital built by Emperor Akbar, featuring the soaring 54-meter Buland Darwaza and Salim Chishti tomb.',
    tourism_tags: ['unesco_world_heritage', 'buland_darwaza', 'mughal_capital', 'red_sandstone', 'sufi_shrine'],
    nearby_attractions: ['Taj Mahal', 'Agra Fort', 'Keoladeo National Park Bharatpur'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 50,
      nearest_airport: 'Agra (AGR) / Delhi (DEL)',
      nearest_railway: 'Fatehpur Sikri / Agra Cantt'
    }
  },

  // ----------------------------------------------------------------------------
  // UTTARAKHAND
  // ----------------------------------------------------------------------------
  {
    id: 'rishikesh-yoga-capital-uttarakhand',
    name: 'Rishikesh Yoga Capital & River Rafting',
    aliases: ['Gateway to the Garhwal Himalayas', 'Rishikesh Ghats'],
    state: 'Uttarakhand',
    district: 'Dehradun',
    city: 'Rishikesh',
    latitude: 30.0869,
    longitude: 78.2676,
    category: 'cultural_hub',
    description:
      'Global Yoga capital on the emerald banks of the Ganges beneath the Himalayas, internationally acclaimed for white-water rafting, Triveni Ghat aarti, and Beatles Ashram.',
    tourism_tags: ['yoga_capital', 'white_water_rafting', 'ganga_aarti', 'beatles_ashram', 'himalayan_gateway'],
    nearby_attractions: ['Ram Jhula & Laxman Jhula', 'Neelkanth Mahadev Temple', 'Haridwar Har Ki Pauri'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Himalayan Adventure & Spiritual Circuit' }
    },
    operational: {
      best_time_to_visit: 'September to November & March to May',
      ideal_duration_hours: 4,
      opening_time: '05:00',
      closing_time: '21:30',
      entry_fee_inr: 0,
      nearest_airport: 'Dehradun Jolly Grant Airport (DED)',
      nearest_railway: 'Yog Nagari Rishikesh (YNRK)'
    }
  },
  {
    id: 'jim-corbett-national-park-uttarakhand',
    name: 'Jim Corbett National Park',
    aliases: ['Corbett Tiger Reserve'],
    state: 'Uttarakhand',
    district: 'Nainital',
    city: 'Ramnagar',
    latitude: 29.53,
    longitude: 78.7747,
    category: 'national_park',
    description:
      'India\'s oldest national park (established in 1936), cradled in the Shivalik foothills and Ramganga river basin, world-famous for Royal Bengal tigers.',
    tourism_tags: ['bengal_tiger', 'oldest_national_park', 'jungle_jeep_safari', 'himalayan_foothills', 'elephants'],
    nearby_attractions: ['Dhikala Zone Grasslands', 'Garjiya Devi Temple', 'Corbett Waterfalls'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'November to June',
      ideal_duration_hours: 5,
      opening_time: '06:00',
      closing_time: '17:30',
      entry_fee_inr: 200,
      nearest_airport: 'Pantnagar Airport (PGH) / Delhi (DEL)',
      nearest_railway: 'Ramnagar Railway Station (RMR)'
    }
  },
  {
    id: 'kedarnath-temple-uttarakhand',
    name: 'Kedarnath Temple',
    aliases: ['Kedarnath Dham'],
    state: 'Uttarakhand',
    district: 'Rudraprayag',
    city: 'Kedarnath',
    latitude: 30.7352,
    longitude: 79.0669,
    category: 'temple',
    description:
      'One of the twelve sacred Jyotirlingas and highest of the Chota Char Dham temples, situated at 11,755 feet near the Chorabari Glacier with Mount Kedarnath towering behind.',
    tourism_tags: ['jyotirlinga', 'chardham_shrine', 'himalayan_trek', 'high_altitude_pilgrimage', 'ancient_stone'],
    nearby_attractions: ['Bhairavnath Temple', 'Gandhi Sarovar', 'Gaurikund Hot Springs'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Chota Char Dham Circuit' }
    },
    operational: {
      best_time_to_visit: 'May to June & September to October (Closes in Winter)',
      ideal_duration_hours: 4,
      opening_time: '04:00',
      closing_time: '21:00',
      entry_fee_inr: 0,
      nearest_airport: 'Dehradun Airport (DED) / Helipad at Guptkashi',
      nearest_railway: 'Rishikesh / Haridwar'
    }
  },

  // ----------------------------------------------------------------------------
  // WEST BENGAL
  // ----------------------------------------------------------------------------
  {
    id: 'victoria-memorial-kolkata-west-bengal',
    name: 'Victoria Memorial & Maidan',
    aliases: ['Victoria Memorial Hall'],
    state: 'West Bengal',
    district: 'Kolkata',
    city: 'Kolkata',
    latitude: 22.5448,
    longitude: 88.3426,
    category: 'museum',
    description:
      'Colossal white Makrana marble monument and museum surrounded by 64 acres of manicured gardens, commemorating the architectural grandeur and history of Kolkata.',
    tourism_tags: ['colonial_monument', 'marble_palace', 'art_museum', 'maidan', 'calcutta_history'],
    nearby_attractions: ['Indian Museum Kolkata', 'Howrah Bridge', 'St. Paul\'s Cathedral Kolkata'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Kolkata Cultural & Colonial Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2.5,
      opening_time: '10:00',
      closing_time: '18:00',
      entry_fee_inr: 50,
      nearest_airport: 'Netaji Subhash Chandra Bose International (CCU)',
      nearest_railway: 'Howrah Junction (HWH) / Sealdah (SDAH)'
    }
  },
  {
    id: 'darjeeling-himalayan-railway-tiger-hill',
    name: 'Darjeeling Tiger Hill & Himalayan Railway',
    aliases: ['UNESCO Toy Train', 'Tiger Hill Sunrise'],
    state: 'West Bengal',
    district: 'Darjeeling',
    city: 'Darjeeling',
    latitude: 27.041,
    longitude: 88.2663,
    category: 'hill_station',
    description:
      'UNESCO World Heritage narrow-gauge steam toy train engineered in 1881, alongside the famed Tiger Hill summit providing sunrise views over Mount Kanchenjunga and Everest.',
    tourism_tags: ['unesco_world_heritage', 'toy_train', 'tiger_hill_sunrise', 'kanchenjunga_view', 'tea_gardens'],
    nearby_attractions: ['Batasia Loop', 'Himalayan Mountaineering Institute', 'Happy Valley Tea Estate'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'March to May & October to December',
      ideal_duration_hours: 4,
      opening_time: '04:00',
      closing_time: '18:00',
      entry_fee_inr: 0,
      nearest_airport: 'Bagdogra Airport (IXB)',
      nearest_railway: 'New Jalpaiguri (NJP) / Darjeeling'
    }
  },
  {
    id: 'sundarbans-national-park-west-bengal',
    name: 'Sundarbans National Park',
    aliases: ['Sundarbans Mangrove Tiger Reserve'],
    state: 'West Bengal',
    district: 'South 24 Parganas',
    city: 'Gosaba',
    latitude: 21.9497,
    longitude: 88.8997,
    category: 'national_park',
    description:
      'UNESCO World Heritage and Ramsar tidal mangrove delta in the Ganges-Brahmaputra confluence, habitat of the legendary swimming Royal Bengal tiger and estuarine crocodiles.',
    tourism_tags: ['unesco_world_heritage', 'mangrove_forest', 'swimming_tigers', 'boat_safari', 'ramsar_site'],
    nearby_attractions: ['Sajnekhali Bird Sanctuary', 'Sudhanyakhali Watch Tower', 'Dobanki Canopy Walk'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true }
    },
    operational: {
      best_time_to_visit: 'September to March',
      ideal_duration_hours: 6,
      opening_time: '07:00',
      closing_time: '17:00',
      entry_fee_inr: 100,
      nearest_airport: 'Kolkata International Airport (CCU)',
      nearest_railway: 'Canning Railway Station'
    }
  },

  // ----------------------------------------------------------------------------
  // UNION TERRITORIES
  // ----------------------------------------------------------------------------
  {
    id: 'radhanagar-beach-havelock-andaman',
    name: 'Radhanagar Beach (Beach No. 7)',
    aliases: ['Havelock Island Beach', 'Swaraj Dweep Beach'],
    state: 'Andaman and Nicobar Islands',
    district: 'South Andaman',
    city: 'Havelock Island (Swaraj Dweep)',
    latitude: 11.9842,
    longitude: 92.9511,
    category: 'beach',
    description:
      'Crowned among Asia\'s finest beaches by Time Magazine, celebrated for powder-soft white sand, turquoise waters, and lush tropical mahua rainforest backdrop.',
    tourism_tags: ['blue_flag_beach', 'sunset_paradise', 'tropical_island', 'scuba_diving', 'white_sand'],
    nearby_attractions: ['Elephant Beach Coral Reef', 'Cellular Jail Port Blair', 'Kalapathar Beach'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'October to May',
      ideal_duration_hours: 3.5,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 0,
      nearest_airport: 'Veer Savarkar International Airport, Port Blair (IXZ)',
      nearest_railway: 'None (Inter-island ferry from Port Blair)'
    }
  },
  {
    id: 'cellular-jail-port-blair-andaman',
    name: 'Cellular Jail National Memorial',
    aliases: ['Kala Pani'],
    state: 'Andaman and Nicobar Islands',
    district: 'South Andaman',
    city: 'Port Blair',
    latitude: 11.6739,
    longitude: 92.7478,
    category: 'historical_monument',
    description:
      'Historic colonial panopticon prison where India\'s freedom fighters were exiled, preserved as a national memorial hosting an evocative sound and light show.',
    tourism_tags: ['national_memorial', 'freedom_struggle_history', 'kala_pani', 'sound_and_light_show'],
    nearby_attractions: ['Ross Island (Netaji Subhash Chandra Bose Dweep)', 'Corbyn\'s Cove Beach', 'Chidiya Tapu Sunset'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism'
    },
    operational: {
      best_time_to_visit: 'October to May',
      ideal_duration_hours: 2.5,
      opening_time: '09:00',
      closing_time: '17:00',
      entry_fee_inr: 30,
      nearest_airport: 'Port Blair Airport (IXZ)',
      nearest_railway: 'None'
    }
  },
  {
    id: 'rock-garden-chandigarh',
    name: 'Nek Chand\'s Rock Garden',
    aliases: ['Chandigarh Rock Garden'],
    state: 'Chandigarh',
    district: 'Chandigarh',
    city: 'Chandigarh',
    latitude: 30.7525,
    longitude: 76.8064,
    category: 'museum',
    description:
      'Visionary 40-acre open-air sculpture garden built entirely from industrial and urban waste, ceramic tiles, glass bangles, and discarded porcelain by artist Nek Chand.',
    tourism_tags: ['recycled_art', 'folk_art_sculptures', 'visionary_architecture', 'urban_park'],
    nearby_attractions: ['Sukhna Lake', 'Le Corbusier Capitol Complex UNESCO', 'Zakir Hussain Rose Garden'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'NATMO'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2.5,
      opening_time: '09:00',
      closing_time: '19:00',
      entry_fee_inr: 30,
      nearest_airport: 'Shaheed Bhagat Singh International, Chandigarh (IXC)',
      nearest_railway: 'Chandigarh Junction (CDG)'
    }
  },
  {
    id: 'diu-fort-daman-and-diu',
    name: 'Diu Fort & Naida Caves',
    aliases: ['Fortaleza de Diu'],
    state: 'Dadra and Nagar Haveli and Daman and Diu',
    district: 'Diu',
    city: 'Diu',
    latitude: 20.7136,
    longitude: 70.9986,
    category: 'fort',
    description:
      'Colossal 1535 Portuguese sea fortress encircled by the Arabian Sea on three sides, with bronze cannons, lighthouses, and natural geological Naida rock labyrinths.',
    tourism_tags: ['portuguese_fort', 'sea_bastion', 'naida_caves', 'cannons', 'island_fortress'],
    nearby_attractions: ['Nagoa Beach', 'St. Paul\'s Church Diu', 'Gangeshwar Mahadev Sea Temple'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'OpenStreetMap'
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '08:00',
      closing_time: '18:00',
      entry_fee_inr: 0,
      nearest_airport: 'Diu Airport (DIU)',
      nearest_railway: 'Veraval Railway Station'
    }
  },
  {
    id: 'qutub-minar-complex-delhi',
    name: 'Qutub Minar & Mehrauli Archaeological Park',
    aliases: ['Qutab Minar', 'Qutb Complex'],
    state: 'Delhi',
    district: 'South Delhi',
    city: 'New Delhi',
    latitude: 28.5245,
    longitude: 77.1855,
    category: 'historical_monument',
    description:
      'UNESCO World Heritage 72.5-meter red sandstone victory minaret erected in 1192, featuring Arabic calligraphy and the rust-resistant 4th-century Gupta Iron Pillar.',
    tourism_tags: ['unesco_world_heritage', 'delhi_sultanate', 'iron_pillar', 'indo_islamic_art', 'ancient_tower'],
    nearby_attractions: ['Red Fort Delhi UNESCO', 'Humayun\'s Tomb UNESCO', 'India Gate', 'Lotus Temple'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Delhi Heritage Walk' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2.5,
      opening_time: '07:00',
      closing_time: '19:00',
      entry_fee_inr: 40,
      nearest_airport: 'Indira Gandhi International Airport (DEL)',
      nearest_railway: 'New Delhi (NDLS) / Hazrat Nizamuddin (NZM)'
    }
  },
  {
    id: 'red-fort-lal-qila-delhi',
    name: 'Red Fort (Lal Qila)',
    aliases: ['Lal Qila Delhi', 'Shahjahanabad Citadel'],
    state: 'Delhi',
    district: 'Central Delhi',
    city: 'Old Delhi',
    latitude: 28.6562,
    longitude: 77.241,
    category: 'fort',
    description:
      'UNESCO World Heritage 17th-century massive red sandstone fortress of Mughal Emperor Shah Jahan, featuring the iconic Lahori Gate, Diwan-i-Aam, and Diwan-i-Khas.',
    tourism_tags: ['unesco_world_heritage', 'mughal_architecture', 'lal_qila', 'independence_day_venue', 'shah_jahan'],
    nearby_attractions: ['Jama Masjid Old Delhi', 'Chandni Chowk Market', 'Raj Ghat'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Golden Triangle Delhi' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3,
      opening_time: '09:30',
      closing_time: '16:30',
      entry_fee_inr: 50,
      nearest_airport: 'Indira Gandhi International Airport (DEL)',
      nearest_railway: 'Old Delhi Junction (DLI)'
    }
  },
  {
    id: 'humayuns-tomb-delhi',
    name: "Humayun's Tomb & Sunder Nursery",
    aliases: ['Mughal Garden Tomb', 'Maqbara-e-Humayun'],
    state: 'Delhi',
    district: 'South East Delhi',
    city: 'New Delhi',
    latitude: 28.5933,
    longitude: 77.2507,
    category: 'historical_monument',
    description:
      'First garden-tomb on the Indian subcontinent and architectural precursor to the Taj Mahal, set within Persian charbagh quadrilateral gardens beside the restored 16th-century Sunder Nursery.',
    tourism_tags: ['unesco_world_heritage', 'charbagh_gardens', 'persian_architecture', 'mughal_dynasty', 'heritage_park'],
    nearby_attractions: ['Hazrat Nizamuddin Dargah', 'National Zoological Park', 'India Gate'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true, mot_circuit: 'Mughal Heritage Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 2.5,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 40,
      nearest_airport: 'Indira Gandhi International Airport (DEL)',
      nearest_railway: 'Hazrat Nizamuddin (NZM)'
    }
  },
  {
    id: 'india-gate-kartavya-path-delhi',
    name: 'India Gate & National War Memorial',
    aliases: ['All India War Memorial', 'Kingsway Kartavya Path'],
    state: 'Delhi',
    district: 'New Delhi',
    city: 'New Delhi',
    latitude: 28.6129,
    longitude: 77.2295,
    category: 'historical_monument',
    description:
      '42-meter triumphal arch designed by Sir Edwin Lutyens honoring 84,000 Indian soldiers, complemented by the circular National War Memorial and Amar Jawan Jyoti flame on Kartavya Path.',
    tourism_tags: ['national_monument', 'lutyens_delhi', 'war_memorial', 'kartavya_path', 'parade_venue'],
    nearby_attractions: ['Rashtrapati Bhavan', 'National Museum New Delhi', 'National Gallery of Modern Art'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'National Capital Heritage' }
    },
    operational: {
      best_time_to_visit: 'All year (Evening preferred)',
      ideal_duration_hours: 2,
      opening_time: '00:00',
      closing_time: '23:59',
      entry_fee_inr: 0,
      nearest_airport: 'Indira Gandhi International Airport (DEL)',
      nearest_railway: 'New Delhi (NDLS)'
    }
  },
  {
    id: 'dal-lake-mughal-gardens-srinagar-kashmir',
    name: 'Dal Lake & Shalimar Bagh',
    aliases: ['Jewel in the Crown of Kashmir', 'Mughal Gardens Srinagar'],
    state: 'Jammu and Kashmir',
    district: 'Srinagar',
    city: 'Srinagar',
    latitude: 34.0837,
    longitude: 74.8398,
    category: 'lake',
    description:
      'World-famous urban lake navigated by colorful wooden Shikaras and ornate British houseboats, flanked by the terraced 17th-century Mughal gardens of Shalimar and Nishat.',
    tourism_tags: ['shikara_ride', 'mughal_gardens', 'floating_vegetable_market', 'houseboats', 'himalayan_lake'],
    nearby_attractions: ['Gulmarg Gondola', 'Pahalgam Betaab Valley', 'Shankaracharya Temple'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Kashmir Valley Circuit' }
    },
    operational: {
      best_time_to_visit: 'April to October',
      ideal_duration_hours: 4,
      opening_time: '06:00',
      closing_time: '20:30',
      entry_fee_inr: 25,
      nearest_airport: 'Sheikh ul-Alam International Airport, Srinagar (SXR)',
      nearest_railway: 'Udhampur / Jammu Tawi'
    }
  },
  {
    id: 'pangong-tso-lake-nubra-valley-ladakh',
    name: 'Pangong Tso & Nubra Valley',
    aliases: ['Pangong Lake', 'Hollow Lake Ladakh'],
    state: 'Ladakh',
    district: 'Leh',
    city: 'Leh',
    latitude: 33.7595,
    longitude: 78.6674,
    category: 'lake',
    description:
      'World\'s highest endorheic saltwater lake at 14,270 feet shifting from turquoise to indigo, alongside Nubra Valley\'s cold desert sand dunes with double-humped Bactrian camels.',
    tourism_tags: ['high_altitude_lake', 'saltwater_lake', 'bactrian_camels', 'khardung_la', 'ladakh_landscapes'],
    nearby_attractions: ['Thiksey Monastery', 'Khardung La Pass', 'Diskit Gompa Giant Buddha'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'NATMO',
      details: { natmo_theme: 'High Altitude Cold Deserts' }
    },
    operational: {
      best_time_to_visit: 'May to September',
      ideal_duration_hours: 6,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 0,
      nearest_airport: 'Kushok Bakula Rimpochee Airport, Leh (IXL)',
      nearest_railway: 'None (Road via Manali or Srinagar)'
    }
  },
  {
    id: 'bangaram-atoll-agatti-lakshadweep',
    name: 'Bangaram Atoll & Agatti Lagoon',
    aliases: ['Bangaram Island Resort', 'Lakshadweep Coral Atolls'],
    state: 'Lakshadweep',
    district: 'Lakshadweep',
    city: 'Agatti / Bangaram',
    latitude: 10.9419,
    longitude: 72.2908,
    category: 'beach',
    description:
      'Teardrop-shaped uninhabited coral atoll surrounded by a shallow turquoise lagoon with phosphorescent plankton, sea turtles, and untouched coral reefs.',
    tourism_tags: ['coral_reef', 'scuba_diving', 'bioluminescent_plankton', 'lagoon', 'island_paradise'],
    nearby_attractions: ['Agatti Island Beach', 'Kavaratti Marine Aquarium', 'Kalpeni Atoll'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Lakshadweep Coral Island Circuit' }
    },
    operational: {
      best_time_to_visit: 'October to May',
      ideal_duration_hours: 5,
      opening_time: '06:00',
      closing_time: '19:00',
      entry_fee_inr: 0,
      nearest_airport: 'Agatti Airport (AGX)',
      nearest_railway: 'None (Speedboat from Agatti)'
    }
  },
  {
    id: 'auroville-french-quarter-puducherry',
    name: 'Auroville & French Quarter (White Town)',
    aliases: ['Matrimandir Auroville', 'Pondicherry White Town'],
    state: 'Puducherry',
    district: 'Puducherry',
    city: 'Puducherry',
    latitude: 11.9338,
    longitude: 79.8297,
    category: 'cultural_hub',
    description:
      'Universal experimental township featuring the golden metallic sphere of Matrimandir, paired with Pondicherry\'s cobblestone French Quarter of pastel bougainvillea villas.',
    tourism_tags: ['matrimandir', 'french_architecture', 'spiritual_meditation', 'promenade_beach', 'boutique_cafes'],
    nearby_attractions: ['Sri Aurobindo Ashram', 'Promenade Beach', 'Paradise Beach Puducherry'],
    sources: {
      mot: true,
      natmo: true,
      osm: true,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { mot_circuit: 'Puducherry Heritage & Wellness' }
    },
    operational: {
      best_time_to_visit: 'October to March',
      ideal_duration_hours: 3.5,
      opening_time: '09:00',
      closing_time: '17:30',
      entry_fee_inr: 0,
      nearest_airport: 'Puducherry Airport (PNY) / Chennai (MAA)',
      nearest_railway: 'Puducherry Railway Station (PDY)'
    }
  }
];
