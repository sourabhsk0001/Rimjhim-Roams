import test from "node:test";
import assert from "node:assert";
import {
  isValidCoordinate,
  haversineDistanceMeters,
  OSMRoutingProvider,
  routingProvider,
  calculateRoute,
  calculateDistance,
  calculateTravelTime,
  GeoCoordinate,
} from "@/lib/geo/routing";

// ==============================================================================
// 1. Coordinate Validation Tests
// ==============================================================================

test("Coordinate Validation: accepts valid coordinates", () => {
  const validPoints: GeoCoordinate[] = [
    { latitude: 28.6139, longitude: 77.209 }, // New Delhi
    { latitude: 15.2993, longitude: 74.124 }, // Goa
    { latitude: 0, longitude: 0 },
    { latitude: 90, longitude: 180 },
    { latitude: -90, longitude: -180 },
  ];

  for (const point of validPoints) {
    assert.strictEqual(
      isValidCoordinate(point),
      true,
      `Point (${point.latitude}, ${point.longitude}) should be valid`
    );
  }
});

test("Coordinate Validation: rejects invalid coordinates", () => {
  const invalidPoints = [
    null,
    undefined,
    "not-a-coordinate",
    {},
    { latitude: 91, longitude: 77.2 }, // Latitude > 90
    { latitude: -91, longitude: 77.2 }, // Latitude < -90
    { latitude: 28.6, longitude: 181 }, // Longitude > 180
    { latitude: 28.6, longitude: -181 }, // Longitude < -180
    { latitude: NaN, longitude: 77.2 },
    { latitude: 28.6, longitude: Infinity },
    { latitude: "28.6", longitude: "77.2" }, // Strings instead of numbers
  ];

  for (const point of invalidPoints) {
    assert.strictEqual(
      isValidCoordinate(point),
      false,
      `Point ${JSON.stringify(point)} must be flagged as invalid`
    );
  }
});

// ==============================================================================
// 2. Haversine Distance Calculation Tests
// ==============================================================================

test("Haversine Distance: identical points return 0 meters", () => {
  const distance = haversineDistanceMeters(28.6139, 77.209, 28.6139, 77.209);
  assert.strictEqual(distance, 0);
});

test("Haversine Distance: calculates realistic distance between known landmarks", () => {
  // Aguada Fort (15.4925, 73.7736) to Calangute Beach (15.5439, 73.7553) in Goa
  const aguadaToCalanguteMeters = haversineDistanceMeters(
    15.4925,
    73.7736,
    15.5439,
    73.7553
  );

  // Approximately 6.0 km as the crow flies
  assert.ok(
    aguadaToCalanguteMeters >= 5500 && aguadaToCalanguteMeters <= 6500,
    `Expected ~6000m, got ${aguadaToCalanguteMeters}m`
  );

  // Delhi (28.6139, 77.2090) to Mumbai (19.0760, 72.8777)
  const delhiToMumbaiMeters = haversineDistanceMeters(
    28.6139,
    77.209,
    19.076,
    72.8777
  );

  // Straight line is ~1,140 to 1,160 km
  assert.ok(
    delhiToMumbaiMeters >= 1100000 && delhiToMumbaiMeters <= 1200000,
    `Expected ~1,150,000m, got ${delhiToMumbaiMeters}m`
  );
});

// ==============================================================================
// 3. Routing Provider Interface & Waypoint Validation
// ==============================================================================

test("RoutingProvider: calculateRoute rejects fewer than 2 waypoints", async () => {
  const resultEmpty = await routingProvider.calculateRoute([]);
  assert.strictEqual(resultEmpty.success, false);
  assert.ok(resultEmpty.error?.includes("At least 2"));

  const resultSingle = await routingProvider.calculateRoute([
    { latitude: 28.6139, longitude: 77.209 },
  ]);
  assert.strictEqual(resultSingle.success, false);
  assert.ok(resultSingle.error?.includes("At least 2"));
});

test("RoutingProvider: calculateRoute rejects invalid coordinates in waypoints", async () => {
  const result = await routingProvider.calculateRoute([
    { latitude: 28.6139, longitude: 77.209 },
    { latitude: 999, longitude: 77.209 }, // Invalid latitude
  ]);

  assert.strictEqual(result.success, false);
  assert.ok(result.error?.includes("Invalid coordinates"));
});

// ==============================================================================
// 4. Fallback Handling on Network Error / Unreachable OSRM
// ==============================================================================

test("RoutingProvider: gracefully falls back to Haversine straight line when server unreachable", async () => {
  // Create provider pointing to an unreachable localhost port to trigger fallback
  const mockUnreachableProvider = new OSMRoutingProvider("http://127.0.0.1:59999");

  const waypoints: GeoCoordinate[] = [
    { latitude: 15.4925, longitude: 73.7736, name: "Aguada Fort" },
    { latitude: 15.5439, longitude: 73.7553, name: "Calangute Beach" },
  ];

  const result = await mockUnreachableProvider.calculateRoute(waypoints, "driving", {
    timeoutMs: 500,
  });

  // Should succeed gracefully via fallback
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.source, "haversine-fallback");
  assert.strictEqual(result.coordinates.length, 2);
  assert.ok(result.distanceMeters > 5000);
  assert.ok(result.distanceKm > 5);
  assert.ok(result.durationMinutes > 0);
  assert.ok(result.error !== undefined);
});

// ==============================================================================
// 5. Travel Modes and Speed Differentiation
// ==============================================================================

test("RoutingProvider: walking travel time is significantly longer than driving", async () => {
  const mockFallbackProvider = new OSMRoutingProvider("http://127.0.0.1:59999");

  const origin: GeoCoordinate = { latitude: 15.4925, longitude: 73.7736 };
  const destination: GeoCoordinate = { latitude: 15.5439, longitude: 73.7553 };

  const driving = await mockFallbackProvider.calculateTravelTime(origin, destination, "driving");
  const walking = await mockFallbackProvider.calculateTravelTime(origin, destination, "walking");
  const cycling = await mockFallbackProvider.calculateTravelTime(origin, destination, "cycling");

  assert.ok(
    walking.durationSeconds > cycling.durationSeconds,
    `Walking (${walking.durationSeconds}s) should take longer than cycling (${cycling.durationSeconds}s)`
  );
  assert.ok(
    cycling.durationSeconds > driving.durationSeconds,
    `Cycling (${cycling.durationSeconds}s) should take longer than driving (${driving.durationSeconds}s)`
  );
});

// ==============================================================================
// 6. Standalone Convenience Functions
// ==============================================================================

test("Routing: standalone calculateDistance and calculateTravelTime work as expected", async () => {
  const origin: GeoCoordinate = { latitude: 26.9124, longitude: 75.7873 }; // Jaipur City
  const destination: GeoCoordinate = { latitude: 26.9855, longitude: 75.8513 }; // Amber Palace

  const distance = await calculateDistance(origin, destination, "driving");
  assert.ok(distance.distanceMeters > 0);
  assert.ok(distance.distanceKm > 0);

  const travelTime = await calculateTravelTime(origin, destination, "driving");
  assert.ok(travelTime.durationSeconds > 0);
  assert.ok(travelTime.durationMinutes > 0);
});
