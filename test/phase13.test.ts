import { before, test } from "node:test";
import assert from "node:assert";
import { safetyService, calculateHaversineKm, normalizeDestinationName } from "../src/lib/services/safety-service";
import { createTrip } from "../src/lib/services/trip-service";
import { collaborationService } from "../src/lib/services/collaboration-service";
import { toolRegistry, SAFETY_TOOL_DEFINITIONS } from "../src/lib/ai/tools/registry";

const userOwner = "user-safety-owner";
const userIntruder = "user-safety-intruder";
let testTripId = "";

before(async () => {
  const tripRes = await createTrip(
    {
      origin: "Mumbai",
      destination: "Goa",
      start_date: "2026-11-10",
      end_date: "2026-11-15",
      budget: 30000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "relaxed",
      preferences: {
        themes: ["beaches", "relaxation"],
        selectedHotel: {
          name: "Taj Fort Aguada Resort",
          address: "Sinquerim, Candolim, Goa 403515",
          phone: "0832-6645858",
        },
      },
    },
    userOwner
  );

  assert.ok(tripRes.data);
  testTripId = tripRes.data.id;
});

// ==============================================================================
// 1. Authoritative Emergency Numbers Verification
// ==============================================================================

test("Safety Center: Authoritative National emergency numbers are present with verified sources", async () => {
  const safety = await safetyService.getDestinationSafetyInfo("Goa");

  assert.ok(safety.emergencyNumbers.length >= 5);

  const erss112 = safety.emergencyNumbers.find((e) => e.number === "112");
  assert.ok(erss112, "ERSS 112 must be present");
  assert.strictEqual(erss112.tollFree, true);
  assert.strictEqual(erss112.category, "universal");
  assert.ok(erss112.source.includes("Ministry of Home Affairs"));
  assert.ok(erss112.retrieved_at);

  const amb108 = safety.emergencyNumbers.find((e) => e.number === "108");
  assert.ok(amb108, "Ambulance 108 must be present");
  assert.strictEqual(amb108.category, "medical");
  assert.ok(amb108.source.includes("Health"));

  const tourist1363 = safety.emergencyNumbers.find((e) => e.number === "1363");
  assert.ok(tourist1363, "National Tourist Helpline 1363 must be present");
  assert.strictEqual(tourist1363.category, "tourist");
  assert.ok(tourist1363.languages && tourist1363.languages.length >= 5);
  assert.ok(tourist1363.source.includes("Ministry of Tourism"));
});

test("Safety Center: Destination-specific emergency helplines are included", async () => {
  const goaSafety = await safetyService.getDestinationSafetyInfo("Goa");
  const beachRescue = goaSafety.emergencyNumbers.find((e) => e.number === "0832-2419100");
  assert.ok(beachRescue, "Goa beach rescue helpline 0832-2419100 must be present");
  assert.ok(beachRescue.source.includes("Drishti"));

  const touristWa = goaSafety.emergencyNumbers.find((e) => e.number === "+91 70690 12345");
  assert.ok(touristWa, "Goa Tourist Police WhatsApp helpline must be present");
});

// ==============================================================================
// 2. Strict Invariants: No Arbitrary Scores & No Fabricated Alerts
// ==============================================================================

test("Safety Invariant: No arbitrary or synthetic safety scores exist", async () => {
  const destinations = ["Goa", "Jaipur", "Manali", "Darjeeling", "Bengaluru", "Varanasi", "Udaipur", "Agra"];

  for (const dest of destinations) {
    const safety = await safetyService.getDestinationSafetyInfo(dest);

    // Assert that no property on safety contains score or rating
    const keys = Object.keys(safety);
    assert.strictEqual(keys.includes("safetyScore"), false);
    assert.strictEqual(keys.includes("safetyRating"), false);
    assert.strictEqual(keys.includes("score"), false);
    assert.strictEqual(keys.includes("rating"), false);

    // Deep check strings
    const jsonStr = JSON.stringify(safety);
    assert.strictEqual(jsonStr.includes("Safety Score:"), false);
    assert.strictEqual(jsonStr.includes("Safety Rating:"), false);
  }
});

test("Safety Invariant: Strictly zero fabricated alerts when no active weather warning exists", async () => {
  const safety = await safetyService.getDestinationSafetyInfo("Jaipur");

  // If there is no active extreme weather, weatherAlerts must be strictly empty
  assert.strictEqual(Array.isArray(safety.weatherAlerts), true);
  assert.strictEqual(safety.weatherAlerts.length, 0);

  // Disclaimer confirms no automated dispatch
  assert.ok(safety.disclaimer.includes("does not provide automated emergency dispatch"));
  assert.ok(safety.disclaimer.includes("112 directly"));
});

// ==============================================================================
// 3. Metadata Integrity: Every Record Has Source & Retrieved_At
// ==============================================================================

test("Metadata Integrity: Every single safety entity includes source and retrieved_at", async () => {
  const destinations = ["Goa", "Jaipur", "Manali"];

  for (const dest of destinations) {
    const safety = await safetyService.getDestinationSafetyInfo(dest);

    for (const h of safety.hospitals) {
      assert.ok(h.source, `Hospital ${h.name} missing source`);
      assert.ok(h.retrieved_at, `Hospital ${h.name} missing retrieved_at`);
      assert.ok(h.phone, `Hospital ${h.name} missing phone`);
      assert.strictEqual(typeof h.latitude, "number");
      assert.strictEqual(typeof h.longitude, "number");
    }

    for (const p of safety.policeStations) {
      assert.ok(p.source, `Police ${p.name} missing source`);
      assert.ok(p.retrieved_at, `Police ${p.name} missing retrieved_at`);
      assert.ok(p.phone, `Police ${p.name} missing phone`);
      assert.strictEqual(typeof p.latitude, "number");
      assert.strictEqual(typeof p.longitude, "number");
    }

    for (const a of safety.travelAdvisories) {
      assert.ok(a.source, `Advisory ${a.title} missing source`);
      assert.ok(a.retrieved_at, `Advisory ${a.title} missing retrieved_at`);
      assert.ok(a.content, `Advisory ${a.title} missing content`);
    }

    for (const d of safety.transportDisruptions) {
      assert.ok(d.source, `Disruption ${d.title} missing source`);
      assert.ok(d.retrieved_at, `Disruption ${d.title} missing retrieved_at`);
    }

    for (const r of safety.localRules) {
      assert.ok(r.source, `Rule ${r.topic} missing source`);
      assert.ok(r.retrieved_at, `Rule ${r.topic} missing retrieved_at`);
      assert.ok(r.rule, `Rule ${r.topic} missing rule`);
      assert.ok(r.statutoryReference, `Rule ${r.topic} missing statutoryReference`);
    }
  }
});

// ==============================================================================
// 4. Proximity & Nearest Facilities Calculation (Haversine Distance)
// ==============================================================================

test("Haversine Proximity: Facilities calculate accurate distance and sort nearest first", async () => {
  // Candolim / Calangute Beach coordinates: ~15.5430, 73.7550
  const userCoords = { latitude: 15.543, longitude: 73.755 };

  const safety = await safetyService.getDestinationSafetyInfo("Goa", userCoords);

  assert.ok(safety.hospitals.length > 0);
  assert.ok(safety.policeStations.length > 0);

  // Check hospitals have distanceKm and are sorted ascending
  for (let i = 0; i < safety.hospitals.length - 1; i++) {
    const current = safety.hospitals[i].distanceKm;
    const next = safety.hospitals[i + 1].distanceKm;
    assert.strictEqual(typeof current, "number");
    assert.strictEqual(typeof next, "number");
    assert.ok(current! <= next!, `Hospitals must be sorted ascending by distanceKm (${current} <= ${next})`);
  }

  // Check nearest police is Calangute Police Station (very close to userCoords)
  const nearestPolice = safety.policeStations[0];
  assert.strictEqual(nearestPolice.name.includes("Calangute"), true);
  assert.ok(nearestPolice.distanceKm! < 2.0, "Calangute police station should be within 2km of userCoords");
});

test("Haversine Distance Helper: Returns known distance within acceptable tolerance", () => {
  // Distance from Delhi (28.6139, 77.2090) to Jaipur (26.9124, 75.7873) is ~238 km
  const dist = calculateHaversineKm(28.6139, 77.209, 26.9124, 75.7873);
  assert.ok(dist >= 235 && dist <= 245, `Distance was ${dist} km, expected ~238 km`);
});

// ==============================================================================
// 5. Trip Context, Authorization & SOS Emergency Card Generation
// ==============================================================================

test("Trip Safety Center: Authorized owner retrieves safety center and emergency card", async () => {
  const result = await safetyService.getTripSafetyCenter(testTripId, userOwner);

  assert.strictEqual(result.authorized, true);
  assert.ok(result.safetyCenter);
  assert.strictEqual(result.safetyCenter.destination, "Goa");
  assert.ok(result.emergencyCard);

  const card = result.emergencyCard;
  assert.strictEqual(card.destination, "Goa");
  assert.strictEqual(card.travelerCount, 2);
  assert.strictEqual(card.hotelName, "Taj Fort Aguada Resort");
  assert.strictEqual(card.emergencyHelpline, "112");
  assert.ok(card.nearestHospital);
  assert.ok(card.nearestPolice);
  assert.ok(card.shareableSummaryText.includes("TRIP EMERGENCY SOS CARD"));
  assert.ok(card.shareableSummaryText.includes("Taj Fort Aguada Resort"));
  assert.ok(card.shareableSummaryText.includes("112"));
});

test("Trip Safety Center: Unauthorized user is rejected", async () => {
  const result = await safetyService.getTripSafetyCenter(testTripId, userIntruder);

  assert.strictEqual(result.authorized, false);
  assert.strictEqual(result.safetyCenter, undefined);
  assert.strictEqual(result.emergencyCard, undefined);
  assert.ok(result.error && result.error.includes("Unauthorized"));
});

test("Trip Emergency Card: Live GPS coordinates embed Google Maps pin when provided", async () => {
  const liveGPS = { latitude: 15.5002, longitude: 73.8201 };
  const result = await safetyService.getEmergencyCard(testTripId, userOwner, liveGPS);

  assert.strictEqual(result.authorized, true);
  assert.ok(result.emergencyCard);
  assert.ok(result.emergencyCard.userLiveCoordinates);
  assert.strictEqual(result.emergencyCard.userLiveCoordinates.latitude, 15.5002);
  assert.ok(result.emergencyCard.userLiveCoordinates.mapsUrl.includes("15.5002,73.8201"));
  assert.ok(result.emergencyCard.shareableSummaryText.includes("Current Live Location: https://www.google.com/maps?q=15.5002,73.8201"));
});

// ==============================================================================
// 6. Graceful Handling of Unlisted / Fallback Destinations
// ==============================================================================

test("Graceful Fallback: Unlisted destinations return national helplines and standard notices without error", async () => {
  const fallbackSafety = await safetyService.getDestinationSafetyInfo("UnknownRemoteVillage");

  assert.strictEqual(fallbackSafety.destination, "UnknownRemoteVillage");
  assert.ok(fallbackSafety.emergencyNumbers.length >= 5);

  // ERSS 112 is always guaranteed
  assert.ok(fallbackSafety.emergencyNumbers.some((n) => n.number === "112"));
  assert.ok(fallbackSafety.emergencyNumbers.some((n) => n.number === "1363"));

  // Advisories contain unlisted notice
  assert.ok(fallbackSafety.travelAdvisories.length > 0);
  assert.ok(fallbackSafety.travelAdvisories[0].content.includes("pending official verification"));

  // Local rules contain standard ASI rule
  assert.ok(fallbackSafety.localRules.length > 0);
  assert.ok(fallbackSafety.localRules[0].source.includes("Archaeological Survey of India"));

  // Does not fabricate fake hospitals
  assert.strictEqual(fallbackSafety.hospitals.length, 0);
});

// ==============================================================================
// 7. AI Copilot Tool Integration
// ==============================================================================

test("AI Copilot Tool: get_safety_info tool executes deterministically with structured data", async () => {
  const context = { userId: userOwner, tripId: testTripId, isAuthorized: true };

  const result = await toolRegistry.executeTool("get_safety_info", { tripId: testTripId }, context);

  assert.strictEqual(result.destination, "Goa");
  assert.ok(Array.isArray(result.emergencyNumbers));
  assert.ok(Array.isArray(result.hospitals));
  assert.ok(Array.isArray(result.policeStations));
  assert.ok(Array.isArray(result.travelAdvisories));
  assert.ok(Array.isArray(result.localRules));
  assert.ok(typeof result.disclaimer === "string");
  assert.ok(result.disclaimer.includes("does not provide automated emergency dispatch"));
});
