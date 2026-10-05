import { test } from 'node:test';
import assert from 'node:assert';
import { ALL_STATES_AND_UTS, INDIA_TOURISM_LOCATIONS } from '../src/lib/data/india-tourism-kb';
import { indiaTourismService, IndiaTourismService } from '../src/lib/services/india-tourism-service';
import { toolRegistry } from '../src/lib/ai/tools/registry';
import { IndiaTourismLocation } from '../src/types/india-tourism';

test('India Tourism KB: All 28 States and 8 Union Territories Coverage', () => {
  assert.strictEqual(ALL_STATES_AND_UTS.length, 36, 'Knowledge base must contain exactly 36 States and UTs');

  const states = ALL_STATES_AND_UTS.filter((s) => !s.is_union_territory);
  const uts = ALL_STATES_AND_UTS.filter((s) => s.is_union_territory);

  assert.strictEqual(states.length, 28, 'Must contain all 28 States');
  assert.strictEqual(uts.length, 8, 'Must contain all 8 Union Territories');

  // Verify key states and UTs are present
  const stateNames = new Set(ALL_STATES_AND_UTS.map((s) => s.name));
  const expectedEntities = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    // 8 UTs
    'Andaman and Nicobar Islands',
    'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Lakshadweep',
    'Puducherry',
  ];

  for (const expected of expectedEntities) {
    assert.ok(stateNames.has(expected), `Missing required State/UT: ${expected}`);
  }

  // Validate structural integrity of each state/UT
  for (const item of ALL_STATES_AND_UTS) {
    assert.ok(item.capital, `${item.name} must have a defined capital`);
    assert.ok(item.zone, `${item.name} must have a designated zone`);
    assert.ok(item.districts_count > 0, `${item.name} must have positive districts count`);
    assert.ok(item.top_destinations.length > 0, `${item.name} must have top destinations`);
    assert.ok(item.primary_tourism_themes.length > 0, `${item.name} must have tourism themes`);
  }
});

test('India Tourism KB: POI Data Provenance and Geographic Precision', () => {
  assert.ok(INDIA_TOURISM_LOCATIONS.length >= 70, 'Knowledge base must contain extensive curated locations');

  for (const loc of INDIA_TOURISM_LOCATIONS) {
    assert.ok(loc.id, `Location must have unique ID: ${loc.name}`);
    assert.ok(loc.name, `Location must have name: ${loc.id}`);
    assert.ok(loc.state, `Location must belong to a State/UT: ${loc.name}`);
    assert.ok(loc.district, `Location must belong to a District: ${loc.name}`);
    assert.ok(loc.city, `Location must specify city/town: ${loc.name}`);

    // Bounding box of India: Lat approx 6°N - 38°N, Lng approx 68°E - 98°E
    assert.ok(
      loc.latitude >= 6.0 && loc.latitude <= 38.0,
      `Latitude out of India bounds for ${loc.name}: ${loc.latitude}`
    );
    assert.ok(
      loc.longitude >= 68.0 && loc.longitude <= 98.0,
      `Longitude out of India bounds for ${loc.name}: ${loc.longitude}`
    );

    // Multi-source provenance verification
    assert.ok(loc.sources, `Multi-source provenance missing for ${loc.name}`);
    assert.ok(
      loc.sources.mot || loc.sources.natmo || loc.sources.osm || loc.sources.geonames,
      `At least one official source must be flagged for ${loc.name}`
    );
    assert.ok(
      ['Ministry of Tourism', 'NATMO', 'OpenStreetMap', 'GeoNames'].includes(
        loc.sources.primary_source
      ),
      `Valid primary source must be designated for ${loc.name}`
    );

    // Operational fields
    assert.ok(loc.operational, `Operational metadata required for ${loc.name}`);
    assert.ok(loc.operational.opening_time, `Opening time required for ${loc.name}`);
    assert.ok(loc.operational.closing_time, `Closing time required for ${loc.name}`);
    assert.ok(
      loc.operational.entry_fee_inr >= 0,
      `Entry fee must be non-negative for ${loc.name}: ${loc.operational.entry_fee_inr}`
    );
  }
});

test('India Tourism Service: Multi-Criteria Search Engine', () => {
  // Search by query keyword
  const tajResult = indiaTourismService.searchLocations({ query: 'Taj Mahal' });
  assert.ok(tajResult.total >= 1, 'Should find Taj Mahal by keyword');
  const taj = tajResult.locations[0];
  assert.strictEqual(taj.city, 'Agra');
  assert.strictEqual(taj.state, 'Uttar Pradesh');
  assert.strictEqual(taj.sources.details?.unesco_recognized, true);

  // Search by State
  const rajasthanResult = indiaTourismService.searchLocations({ state: 'Rajasthan' });
  assert.ok(rajasthanResult.total >= 3, 'Should find Rajasthan attractions');
  assert.ok(
    rajasthanResult.locations.every((l) => l.state === 'Rajasthan'),
    'All returned items must belong to Rajasthan'
  );
  assert.ok(rajasthanResult.stateSummary, 'Should attach state summary');
  assert.strictEqual(rajasthanResult.stateSummary?.capital, 'Jaipur');

  // Search by Category
  const templesResult = indiaTourismService.searchLocations({ category: 'temple' });
  assert.ok(templesResult.total >= 5, 'Should find temple attractions');
  assert.ok(
    templesResult.locations.every((l) => l.category === 'temple'),
    'All returned items must have temple category'
  );

  // Filter by Max Entry Fee
  const freeResult = indiaTourismService.searchLocations({ maxEntryFee: 0 });
  assert.ok(freeResult.total >= 5, 'Should find free attractions');
  assert.ok(
    freeResult.locations.every((l) => l.operational.entry_fee_inr === 0),
    'All returned items must have free entry'
  );
});

test('India Tourism Service: Spatial Proximity Queries (Haversine)', () => {
  // Center near Taj Mahal, Agra (27.1751, 78.0421)
  const nearbyAgra = indiaTourismService.getNearbyLocations(27.1751, 78.0421, 50, 10);
  assert.ok(nearbyAgra.length >= 2, 'Should find attractions near Agra coordinates');

  // Nearest should be Taj Mahal or Agra Fort within ~5 km
  assert.ok(
    nearbyAgra[0].distanceKm < 1.0,
    `Closest site should be within 1km of coordinates: ${nearbyAgra[0].distanceKm}`
  );

  // Verify distance ordering (ascending)
  for (let i = 0; i < nearbyAgra.length - 1; i++) {
    assert.ok(
      nearbyAgra[i].distanceKm <= nearbyAgra[i + 1].distanceKm,
      'Nearby locations must be sorted by distance ascending'
    );
  }
});

test('India Tourism Service: Deduplication & Conflict Resolution', () => {
  const service = new IndiaTourismService();

  const mockDuplicate1: IndiaTourismLocation = {
    id: 'hampi-vijayanagara-karnataka',
    name: 'Group of Monuments at Hampi',
    aliases: ['Hampi Ruins'],
    state: 'Karnataka',
    district: 'Vijayanagara',
    city: 'Hampi',
    latitude: 15.335,
    longitude: 76.46,
    category: 'historical_monument',
    description: 'OSM POI description for Hampi.',
    tourism_tags: ['unesco', 'osm_poi'],
    nearby_attractions: ['Virupaksha Temple'],
    sources: {
      mot: false,
      natmo: false,
      osm: true,
      geonames: false,
      primary_source: 'OpenStreetMap',
    },
    operational: {
      best_time_to_visit: 'October to February',
      ideal_duration_hours: 4,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 40,
    },
  };

  const mockDuplicate2: IndiaTourismLocation = {
    id: 'hampi-vijayanagara-karnataka',
    name: 'Group of Monuments at Hampi',
    aliases: ['Hampi UNESCO Heritage'],
    state: 'Karnataka',
    district: 'Vijayanagara',
    city: 'Hampi',
    latitude: 15.335,
    longitude: 76.46,
    category: 'historical_monument',
    description: 'Official Ministry of Tourism verified narrative for Hampi Vijayanagara empire.',
    tourism_tags: ['unesco', 'mot_verified'],
    nearby_attractions: ['Vittala Temple'],
    sources: {
      mot: true,
      natmo: true,
      osm: false,
      geonames: true,
      primary_source: 'Ministry of Tourism',
      details: { unesco_recognized: true },
    },
    operational: {
      best_time_to_visit: 'October to February',
      ideal_duration_hours: 5,
      opening_time: '06:00',
      closing_time: '18:00',
      entry_fee_inr: 40,
    },
  };

  const deduped = service.deduplicateLocations([mockDuplicate1, mockDuplicate2]);
  assert.strictEqual(deduped.length, 1, 'Duplicate records must be merged into one');

  const merged = deduped[0];
  // MoT priority over OSM for description and primary authority
  assert.strictEqual(merged.sources.primary_source, 'Ministry of Tourism');
  assert.ok(merged.description.includes('Ministry of Tourism verified narrative'));

  // Both sources must be flagged true in merged record
  assert.strictEqual(merged.sources.mot, true);
  assert.strictEqual(merged.sources.osm, true);
  assert.strictEqual(merged.sources.geonames, true);

  // Tags and nearby attractions should be unioned
  assert.ok(merged.tourism_tags.includes('osm_poi'));
  assert.ok(merged.tourism_tags.includes('mot_verified'));
  assert.ok(merged.nearby_attractions.includes('Virupaksha Temple'));
  assert.ok(merged.nearby_attractions.includes('Vittala Temple'));
});

test('India Tourism Service: AI Itinerary Recommendation Engine', () => {
  const recommendation = indiaTourismService.recommendForItinerary({
    state: 'Rajasthan',
    maxDays: 3,
  });

  assert.strictEqual(recommendation.stateOrRegion, 'Rajasthan');
  assert.strictEqual(recommendation.totalDays, 3);
  assert.ok(recommendation.daysPlan.length === 3, 'Must produce 3 day plans');
  assert.ok(recommendation.suggestedRoute.length > 0, 'Must produce a suggested route');
  assert.ok(recommendation.travelTips.length > 0, 'Must include official travel tips');
  assert.ok(
    recommendation.sourceAttribution.motVerifiedCount >= 0,
    'Must include multi-source attribution counts'
  );

  for (const day of recommendation.daysPlan) {
    assert.ok(day.day >= 1 && day.day <= 3);
    assert.ok(day.theme, 'Each day must have a theme');
    assert.ok(day.estimatedHours > 0, 'Estimated hours must be greater than zero');
  }
});

test('AI Copilot Tool Registry: search_india_tourism_kb Execution', async () => {
  // Test 1: Standard query
  const searchResult = await toolRegistry.executeTool(
    'search_india_tourism_kb',
    { query: 'Varanasi' },
    { tripId: 'test-trip', userId: 'test-user', isAuthorized: true }
  );

  assert.strictEqual(searchResult.type, 'knowledge_base_search');
  assert.ok((searchResult.totalFound as number) >= 1);
  const locations = searchResult.locations as Array<Record<string, unknown>>;
  assert.ok(locations.length >= 1);
  assert.ok(locations[0].name);
  assert.ok(locations[0].coordinates);

  // Test 2: Spatial search
  const spatialResult = await toolRegistry.executeTool(
    'search_india_tourism_kb',
    { latitude: 28.6139, longitude: 77.209, radiusKm: 30 },
    { tripId: 'test-trip', userId: 'test-user', isAuthorized: true }
  );

  assert.strictEqual(spatialResult.type, 'nearby_spatial_search');
  assert.ok((spatialResult.totalFound as number) >= 1);

  // Test 3: AI Itinerary recommendation
  const itineraryResult = await toolRegistry.executeTool(
    'search_india_tourism_kb',
    { recommendItinerary: true, state: 'Kerala', days: 2 },
    { tripId: 'test-trip', userId: 'test-user', isAuthorized: true }
  );

  assert.strictEqual(itineraryResult.type, 'itinerary_recommendation');
  assert.strictEqual(itineraryResult.stateOrRegion, 'Kerala');
  assert.strictEqual(itineraryResult.totalDays, 2);
});
