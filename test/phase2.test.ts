import test from "node:test";
import assert from "node:assert";
import {
  DEMO_DESTINATIONS,
  getDestinations,
  getDestinationById,
  getDestinationAttractions,
  getDestinationHotels,
  getDestinationRestaurants,
  getDestinationTransport,
  findNearbyAttractions,
  calculateDistanceKm,
} from "@/lib/services/travel-data-service";

// ==============================================================================
// 1. Destination Seed & DEMO Status Tests
// ==============================================================================

test("Destinations: all 8 required demo destinations exist", () => {
  const requiredCities = [
    "Goa",
    "Jaipur",
    "Darjeeling",
    "Delhi",
    "Mumbai",
    "Kolkata",
    "Manali",
    "Bengaluru",
  ];

  const cityNames = DEMO_DESTINATIONS.map((d) => d.name);

  for (const city of requiredCities) {
    assert.ok(
      cityNames.includes(city),
      `Destination '${city}' must be present in seeded demo destinations`
    );
  }

  assert.strictEqual(DEMO_DESTINATIONS.length, 8);
});

test("Destinations: all seeded destinations are explicitly flagged as DEMO", () => {
  for (const dest of DEMO_DESTINATIONS) {
    assert.strictEqual(
      dest.data_status,
      "DEMO",
      `Destination ${dest.name} must have data_status 'DEMO'`
    );
    assert.strictEqual(
      dest.source,
      "DEMO",
      `Destination ${dest.name} must have source 'DEMO'`
    );
  }
});

// ==============================================================================
// 2. Query, Search & Climate Filtering Tests
// ==============================================================================

test("Destinations Query: search by keyword", async () => {
  const results = await getDestinations("Jaipur");
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].name, "Jaipur");
  assert.strictEqual(results[0].state_province, "Rajasthan");
});

test("Destinations Query: filter by climate", async () => {
  const alpineResults = await getDestinations(undefined, "Alpine");
  assert.ok(alpineResults.length >= 2, "Should find Darjeeling and Manali");
  const names = alpineResults.map((d) => d.name);
  assert.ok(names.includes("Darjeeling"));
  assert.ok(names.includes("Manali"));
});

test("Destinations Query: retrieve single destination by ID", async () => {
  const goa = await getDestinationById("dest-goa");
  assert.ok(goa);
  assert.strictEqual(goa.name, "Goa");
  assert.strictEqual(goa.climate, "Tropical Coastal");
});

// ==============================================================================
// 3. Child Entities: Attractions, Hotels, Dining & Transport
// ==============================================================================

test("Attractions: retrieves attractions with required operational fields", async () => {
  const attractions = await getDestinationAttractions("dest-goa");
  assert.ok(attractions.length > 0, "Goa should have seeded attractions");

  const aguada = attractions.find((a) => a.name.includes("Aguada"));
  assert.ok(aguada);
  assert.ok(aguada.opening_time);
  assert.ok(aguada.closing_time);
  assert.ok(aguada.recommended_visit_minutes > 0);
  assert.ok(aguada.weather_suitability);
  assert.strictEqual(aguada.data_status, "DEMO");
});

test("Hotels: retrieves accommodations with pricing and amenities", async () => {
  const hotels = await getDestinationHotels("dest-jaipur");
  assert.ok(hotels.length > 0, "Jaipur should have seeded hotels");

  const palace = hotels[0];
  assert.ok(palace.price_per_night > 0);
  assert.ok(palace.rating >= 1 && palace.rating <= 5);
  assert.ok(palace.amenities.length > 0);
  assert.strictEqual(palace.data_status, "DEMO");
});

test("Restaurants: retrieves dining spots with cuisine and price level", async () => {
  const dining = await getDestinationRestaurants("dest-delhi");
  assert.ok(dining.length > 0, "Delhi should have seeded dining options");

  const restaurant = dining[0];
  assert.ok(restaurant.cuisine);
  assert.ok(restaurant.estimated_price_per_person > 0);
  assert.ok(restaurant.dietary_options.length > 0);
  assert.strictEqual(restaurant.data_status, "DEMO");
});

test("Transport: retrieves transit options and taxi tariffs", async () => {
  const { transport, taxis } = await getDestinationTransport("dest-goa");
  assert.ok(transport.length > 0, "Goa should have transport options");
  assert.ok(taxis.length > 0, "Goa should have taxi tariffs");

  const route = transport[0];
  assert.ok(route.origin);
  assert.ok(route.destination);
  assert.ok(route.price > 0);
  assert.strictEqual(route.data_status, "DEMO");

  const taxi = taxis[0];
  assert.ok(taxi.base_fare > 0);
  assert.ok(taxi.price_per_km > 0);
  assert.strictEqual(taxi.data_status, "DEMO");
});

// ==============================================================================
// 4. PostGIS Spatial Distance & Radius Queries
// ==============================================================================

test("Spatial Calculation: Haversine distance between New Delhi and Jaipur", () => {
  // New Delhi coords: (28.6139, 77.2090)
  // Jaipur coords: (26.9124, 75.7873)
  // Straight-line distance is approx 235-245 km
  const distance = calculateDistanceKm(28.6139, 77.209, 26.9124, 75.7873);
  assert.ok(
    distance > 230 && distance < 250,
    `Calculated distance (${distance} km) should be between 230 and 250 km`
  );
});

test("Spatial Radius Search: finds nearby attractions within 25 km radius", async () => {
  // Center: Fort Aguada Goa (15.4920, 73.7737)
  const nearby = await findNearbyAttractions(15.492, 73.7737, 25);
  assert.ok(nearby.length > 0, "Should find attractions near Aguada in Goa");

  // Closest attraction should be Aguada Fort itself (< 1 km)
  assert.ok(nearby[0].distance_km < 1.0);
  assert.strictEqual(nearby[0].name, "Aguada Fort & Lighthouse");

  // All returned results must be within 25 km
  for (const item of nearby) {
    assert.ok(item.distance_km <= 25);
    assert.strictEqual(item.data_status, "DEMO");
  }
});
