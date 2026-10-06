import test from "node:test";
import assert from "node:assert";
import {
  DESTINATION_TRANSIT_HUBS,
  getDestinationTransitHubs,
  TransitHub,
} from "../src/lib/geo/transit-hubs";
import { MapMarkerItem } from "../src/components/map/map-inner";

test("MapLibre Transit Hubs: Predefined catalog covers all key Indian destinations", () => {
  const expectedDestinations = [
    "dest-goa",
    "dest-jaipur",
    "dest-delhi",
    "dest-mumbai",
    "dest-darjeeling",
    "dest-kolkata",
    "dest-bengaluru",
    "dest-manali",
  ];

  for (const destId of expectedDestinations) {
    const hubs = DESTINATION_TRANSIT_HUBS[destId];
    assert(
      Array.isArray(hubs) && hubs.length >= 3,
      `Expected at least 3 transit hubs for ${destId}`
    );

    const hasAirport = hubs.some((h) => h.type === "airport");
    const hasRailway = hubs.some((h) => h.type === "railway");
    const hasTaxi = hubs.some((h) => h.type === "taxi");

    assert(hasAirport, `Destination ${destId} should have an airport`);
    assert(hasRailway, `Destination ${destId} should have a railway station`);
    assert(hasTaxi, `Destination ${destId} should have a taxi pickup stand`);
  }
});

test("MapLibre Transit Hubs: Coordinates, ratings, and fare estimates are realistic", () => {
  for (const [destId, hubs] of Object.entries(DESTINATION_TRANSIT_HUBS)) {
    for (const hub of hubs) {
      assert(hub.id.length > 0, "Hub ID must be non-empty");
      assert(hub.name.length > 0, "Hub name must be non-empty");

      // Valid Indian bounding box: Latitude 8 - 36, Longitude 68 - 98
      assert(
        hub.latitude >= 8 && hub.latitude <= 36,
        `Hub ${hub.name} (${destId}) latitude ${hub.latitude} out of bounds`
      );
      assert(
        hub.longitude >= 68 && hub.longitude <= 98,
        `Hub ${hub.name} (${destId}) longitude ${hub.longitude} out of bounds`
      );

      // Rating must be between 3.5 and 5.0
      assert(
        hub.rating >= 3.5 && hub.rating <= 5.0,
        `Hub ${hub.name} rating ${hub.rating} should be realistic (3.5 - 5.0)`
      );

      // Estimated transfer fare must be realistic positive integer
      assert(
        hub.estimatedTransferCostInr > 0 &&
          hub.estimatedTransferCostInr <= 5000,
        `Hub ${hub.name} fare INR ${hub.estimatedTransferCostInr} must be realistic`
      );

      // Transfer time must be realistic positive integer
      assert(
        hub.typicalTransferMinutes > 0 && hub.typicalTransferMinutes <= 300,
        `Hub ${hub.name} duration ${hub.typicalTransferMinutes}m must be realistic`
      );
    }
  }
});

test("MapLibre Transit Hubs: Lookup handles case-insensitive names and fallbacks", () => {
  // Direct ID lookup
  const goaHubs = getDestinationTransitHubs("dest-goa");
  assert.strictEqual(goaHubs.length, 4);

  // Case-insensitive name lookup
  const jaipurHubs = getDestinationTransitHubs("Jaipur");
  assert(jaipurHubs.length >= 3);
  assert(jaipurHubs.some((h) => h.code === "JAI"));

  // Substring match
  const mumbaiHubs = getDestinationTransitHubs("mumbai");
  assert(mumbaiHubs.length >= 3);
  assert(mumbaiHubs.some((h) => h.code === "BOM"));

  // Procedural generation fallback for non-catalog coordinates
  const customHubs = getDestinationTransitHubs(
    "custom-shimla",
    31.1048,
    77.1734,
    "Shimla"
  );
  assert.strictEqual(customHubs.length, 3);
  assert(customHubs.some((h) => h.type === "airport"));
  assert(customHubs.some((h) => h.type === "railway"));
  assert(customHubs.some((h) => h.type === "taxi"));
  assert(customHubs[0].name.includes("Shimla"));
});

test("MapLibre Marker Types: Correctly supports 8 marker categories", () => {
  const sampleMarkers: MapMarkerItem[] = [
    {
      id: "dest-1",
      name: "Jaipur City Center",
      latitude: 26.9124,
      longitude: 75.7873,
      type: "destination",
    },
    {
      id: "hotel-1",
      name: "Taj Rambagh Palace",
      latitude: 26.897,
      longitude: 75.808,
      type: "hotel",
      details: { price: "₹24,000/night", rating: 4.9 },
    },
    {
      id: "attr-1",
      name: "Hawa Mahal",
      latitude: 26.9239,
      longitude: 75.8267,
      type: "attraction",
      order: 1,
      details: { price: 200, rating: 4.7, hours: "09:00 - 17:00" },
    },
    {
      id: "rest-1",
      name: "LMB Sweets & Thali",
      latitude: 26.921,
      longitude: 75.824,
      type: "restaurant",
      order: 2,
      details: { cuisine: "Rajasthani", price: "$$" },
    },
    {
      id: "taxi-1",
      name: "Sindhi Camp Taxi Stand",
      latitude: 26.922,
      longitude: 75.795,
      type: "taxi",
      details: { vehicleType: "Prepaid Auto & Cab", estimatedCost: 90 },
    },
    {
      id: "airport-1",
      name: "Jaipur International Airport",
      latitude: 26.8286,
      longitude: 75.8056,
      type: "airport",
      code: "JAI",
      details: { estimatedCost: 450, durationMinutes: 28, rating: 4.5 },
    },
    {
      id: "railway-1",
      name: "Jaipur Junction",
      latitude: 26.9208,
      longitude: 75.7878,
      type: "railway",
      code: "JP",
      details: { estimatedCost: 120, durationMinutes: 12, rating: 4.3 },
    },
    {
      id: "current-loc-1",
      name: "Current Active Stop",
      latitude: 26.9239,
      longitude: 75.8267,
      type: "current_location",
    },
  ];

  assert.strictEqual(sampleMarkers.length, 8);
  const types = new Set(sampleMarkers.map((m) => m.type));
  assert(types.has("hotel"), "Supports hotel markers");
  assert(types.has("attraction"), "Supports attraction markers");
  assert(types.has("restaurant"), "Supports restaurant markers");
  assert(types.has("taxi"), "Supports taxi markers");
  assert(types.has("airport"), "Supports airport markers");
  assert(types.has("railway"), "Supports railway markers");
  assert(types.has("destination"), "Supports destination markers");
  assert(types.has("current_location"), "Supports current location markers");
});
