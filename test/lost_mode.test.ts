import test from "node:test";
import assert from "node:assert";
import { lostModeService } from "../src/lib/services/lost-mode-service";
import { createTrip } from "../src/lib/services/trip-service";

const testUserId = "user-lost-mode-test-01";
const strangerUserId = "user-intruder-99";
let testTripId = "";

test("Setup: Create a mock trip for Lost Mode tests", async () => {
  const tripRes = await createTrip(
    {
      origin: "Delhi",
      destination: "Jaipur",
      start_date: "2026-11-10",
      end_date: "2026-11-15",
      budget: 25000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "relaxed",
      preferences: { themes: ["heritage", "culture", "food"] },
    },
    testUserId
  );

  assert.ok(tripRes.data, "Trip creation failed");
  testTripId = tripRes.data.id;
  assert.ok(testTripId.length > 0, "Test trip ID is empty");
});

test("Lost Mode: Rejects unauthorized access from non-members", async () => {
  await assert.rejects(
    async () => {
      await lostModeService.calculateLostRecovery(testTripId, strangerUserId);
    },
    /Trip not found or unauthorized/,
    "Should reject unauthorized stranger"
  );
});

test("Lost Mode: Calculates recovery with simulated GPS offset (~1.1 km) when coordinates are absent", async () => {
  const result = await lostModeService.calculateLostRecovery(testTripId, testUserId);

  assert.ok(result, "Recovery result must be defined");
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.destinationName, "Jaipur");

  // Current Location is simulated
  assert.strictEqual(result.currentLocation.isSimulated, true);
  assert.ok(result.currentLocation.latitude > 25 && result.currentLocation.latitude < 28);
  assert.ok(result.currentLocation.longitude > 74 && result.currentLocation.longitude < 77);
  assert.ok(result.currentLocation.name.includes("Off-Route"));

  // Planned stop context
  assert.ok(result.plannedCurrentStop.name.length > 0);
  assert.ok(result.plannedCurrentStop.scheduledTime.length > 0);
  assert.ok(result.plannedCurrentStop.latitude !== 0);
  assert.ok(result.plannedCurrentStop.longitude !== 0);

  // Next planned stop
  if (result.nextPlannedStop) {
    assert.ok(result.nextPlannedStop.name.length > 0);
    assert.ok(result.nextPlannedStop.scheduledTime.length > 0);
  }

  // Distance & Bearing
  assert.ok(result.distanceToTargetMeters > 0, "Distance meters should be positive");
  assert.ok(result.distanceToTargetKm > 0, "Distance km should be positive");
  assert.match(
    result.bearingCompass,
    /^(North|North-East|East|South-East|South|South-West|West|North-West) \(\d+°\)$/,
    "Compass heading must match standard format"
  );
});

test("Lost Mode: Calculates recovery with live coordinates lock", async () => {
  const liveCoords = {
    latitude: 26.915,
    longitude: 75.79,
    accuracy: 8,
  };

  const result = await lostModeService.calculateLostRecovery(
    testTripId,
    testUserId,
    liveCoords
  );

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.currentLocation.isSimulated, false);
  assert.strictEqual(result.currentLocation.latitude, 26.915);
  assert.strictEqual(result.currentLocation.longitude, 75.79);
  assert.strictEqual(result.currentLocation.accuracyMeters, 8);
  assert.ok(result.currentLocation.name.includes("GPS ±8m"));

  // Walking route
  assert.ok(result.primaryWalkingRoute.distanceKm > 0);
  assert.ok(result.primaryWalkingRoute.durationMinutes > 0);
  assert.ok(result.primaryWalkingRoute.etaTimeString.match(/\d+:\d+ (AM|PM)/));
  assert.ok(result.primaryWalkingRoute.coordinates.length >= 2, "Path must have at least 2 coordinate points");
  assert.ok(result.primaryWalkingRoute.turnByTurnSteps.length >= 2, "Must contain step-by-step turns");

  // Step validation
  for (const step of result.primaryWalkingRoute.turnByTurnSteps) {
    assert.ok(step.instruction.length > 0);
    assert.ok(step.distanceMeters >= 0);
    assert.ok(["straight", "left", "right", "u_turn", "destination"].includes(step.turnDirection));
  }

  // Alternative driving route
  assert.ok(["driving", "cab"].includes(result.alternativeDrivingRoute.mode));
  assert.ok(result.alternativeDrivingRoute.durationMinutes > 0);
  assert.ok(result.alternativeDrivingRoute.estimatedFareInr !== undefined);
  assert.ok(
    (result.alternativeDrivingRoute.estimatedFareInr ?? 0) >= 30,
    "Auto/cab fare estimate should be reasonable"
  );
  assert.ok(result.alternativeDrivingRoute.coordinates.length >= 2);
});

test("Lost Mode: Provides nearby safe public havens (Police, Hospital, Transit, Cafes)", async () => {
  const result = await lostModeService.calculateLostRecovery(testTripId, testUserId);

  assert.ok(Array.isArray(result.nearbySafePlaces));
  assert.ok(result.nearbySafePlaces.length >= 3, "Should include multiple nearby safe havens");

  const police = result.nearbySafePlaces.find((p) => p.type === "police");
  assert.ok(police, "Must provide nearest Police Station");
  assert.ok(police.is24x7, "Police station must be 24x7");
  assert.ok(police.phone && police.phone.length > 0, "Must provide emergency telephone number");

  const hospital = result.nearbySafePlaces.find((p) => p.type === "hospital");
  assert.ok(hospital, "Must provide nearest Hospital/Medical Center");
  assert.ok(hospital.phone && hospital.phone.length > 0);

  // Safe places must be sorted in ascending order of distance
  for (let i = 0; i < result.nearbySafePlaces.length - 1; i++) {
    assert.ok(
      result.nearbySafePlaces[i].distanceMeters <= result.nearbySafePlaces[i + 1].distanceMeters,
      "Safe places should be sorted by closest distance"
    );
  }
});

test("Lost Mode: Generates comforting AI conversational reassurance and step advice", async () => {
  const result = await lostModeService.calculateLostRecovery(testTripId, testUserId);

  assert.ok(result.aiGuidance.headline.includes("You're"));
  assert.ok(result.aiGuidance.headline.includes("km away from your planned destination"));
  assert.ok(result.aiGuidance.plainExplanation.includes("Don't worry!"));
  assert.ok(result.aiGuidance.stepByStepAdvice.length >= 3);
  assert.ok(result.aiGuidance.quickHelpline.includes("1363"));
  assert.ok(result.aiGuidance.quickHelpline.includes("112"));
});

test("Lost Mode: Formats actionable emergency SOS share message with Google Maps link", async () => {
  const result = await lostModeService.calculateLostRecovery(testTripId, testUserId, {
    latitude: 26.920,
    longitude: 75.820,
  });

  const msg = result.shareableDistressMessage;
  assert.ok(msg.includes("🆘 [RIMJHIM ROAMS - TRAVEL ASSISTANCE]"));
  assert.ok(msg.includes("https://maps.google.com/?q=26.920000,75.820000"));
  assert.ok(msg.includes("Destination: Jaipur"));
  assert.ok(msg.includes("Planned Stop:"));
  assert.ok(msg.includes("Tourist Helpline: 1363 | Emergency: 112"));
});
