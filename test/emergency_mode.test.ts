import test from "node:test";
import assert from "node:assert";
import { emergencyModeService } from "../src/lib/services/emergency-mode-service";
import { createTrip } from "../src/lib/services/trip-service";

const testUserId = "user-emergency-mode-tester-01";
const strangerUserId = "user-intruder-emergency-99";
let testTripId = "";

test("Setup: Create a mock trip for Emergency Mode tests", async () => {
  const tripRes = await createTrip(
    {
      origin: "Mumbai",
      destination: "Goa",
      start_date: "2026-12-05",
      end_date: "2026-12-10",
      budget: 30000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "moderate",
      preferences: {
        themes: ["beaches", "relaxation"],
        selectedHotel: {
          name: "Taj Fort Aguada Resort & Spa",
          address: "Sinquerim, Candolim, Goa 403515",
          phone: "+91 832 664 5858",
          latitude: 15.496,
          longitude: 73.768,
        },
      },
    },
    testUserId
  );

  assert.ok(tripRes.data, "Trip creation failed");
  testTripId = tripRes.data.id;
  assert.ok(testTripId.length > 0, "Test trip ID is empty");
});

test("Emergency Mode: Rejects unauthorized access from non-members", async () => {
  await assert.rejects(
    async () => {
      await emergencyModeService.getEmergencyModeData(testTripId, strangerUserId);
    },
    /Trip not found or unauthorized/,
    "Should reject unauthorized caller"
  );
});

test("Emergency Mode: Retrieves complete decision-support package with simulated coordinates", async () => {
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId);

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.tripId, testTripId);
  assert.strictEqual(result.destination, "Goa");

  // Current Location is simulated fallback
  assert.strictEqual(result.currentLocation.isSimulated, true);
  assert.ok(result.currentLocation.latitude > 15 && result.currentLocation.latitude < 16);
  assert.ok(result.currentLocation.longitude > 73 && result.currentLocation.longitude < 74);
  assert.ok(result.currentLocation.mapsUrl.includes("maps.google.com"));

  // Decision-support disclaimer invariant
  assert.strictEqual(result.disclaimer.isDecisionSupportOnly, true);
  assert.strictEqual(result.disclaimer.urgentCallNumber, "112");
  assert.ok(result.disclaimer.message.includes("NOT an emergency dispatch"));
  assert.ok(result.disclaimer.message.includes("dial 112 or 108"));
});

test("Emergency Mode: Verifies National Emergency Helplines (112, 108, 100, 1363)", async () => {
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId);

  assert.ok(Array.isArray(result.emergencyNumbers));
  assert.ok(result.emergencyNumbers.length >= 6);

  const num112 = result.emergencyNumbers.find((n) => n.number === "112");
  assert.ok(num112, "Must include 112 Universal Emergency number");
  assert.strictEqual(num112.tollFree, true);

  const num108 = result.emergencyNumbers.find((n) => n.number === "108");
  assert.ok(num108, "Must include 108 Ambulance");

  const num1363 = result.emergencyNumbers.find((n) => n.number === "1363");
  assert.ok(num1363, "Must include 1363 Tourist Helpline");
});

test("Emergency Mode: Resolves Nearby Hospitals with 24/7 emergency capabilities", async () => {
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId);

  assert.ok(Array.isArray(result.nearbyHospitals));
  assert.ok(result.nearbyHospitals.length >= 2, "Should include multiple hospitals");

  const primaryHosp = result.nearbyHospitals[0];
  assert.ok(primaryHosp.name.length > 0);
  assert.strictEqual(primaryHosp.type, "hospital");
  assert.strictEqual(primaryHosp.has24x7Emergency, true);
  assert.ok(primaryHosp.phone.length > 0);
  assert.ok(primaryHosp.address.length > 0);
  assert.ok(primaryHosp.distanceMeters >= 0);
  assert.ok(primaryHosp.distanceKm >= 0);
  assert.ok(primaryHosp.walkingMinutes > 0);
  assert.ok(primaryHosp.drivingMinutes > 0);

  // Proximity sorting
  for (let i = 0; i < result.nearbyHospitals.length - 1; i++) {
    assert.ok(
      result.nearbyHospitals[i].distanceMeters <= result.nearbyHospitals[i + 1].distanceMeters,
      "Hospitals must be sorted by closest distance"
    );
  }
});

test("Emergency Mode: Resolves Nearby Police Stations & Tourist Units", async () => {
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId);

  assert.ok(Array.isArray(result.nearbyPoliceStations));
  assert.ok(result.nearbyPoliceStations.length >= 2);

  const pol = result.nearbyPoliceStations[0];
  assert.ok(pol.name.length > 0);
  assert.strictEqual(pol.type, "police");
  assert.ok(pol.phone.length > 0);
  assert.ok(pol.distanceMeters >= 0);
});

test("Emergency Mode: Resolves 24/7 Pharmacies & Chemists", async () => {
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId);

  assert.ok(Array.isArray(result.nearbyPharmacies));
  assert.ok(result.nearbyPharmacies.length >= 1, "Should include verified pharmacies");

  const pharm = result.nearbyPharmacies[0];
  assert.strictEqual(pharm.type, "pharmacy");
  assert.ok(pharm.name.length > 0);
  assert.ok(pharm.phone.length > 0);
  assert.ok(pharm.address.length > 0);
  assert.ok(pharm.operatingHours && pharm.operatingHours.length > 0);
});

test("Emergency Mode: Resolves Embassies and Consular Diplomatic Missions", async () => {
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId);

  assert.ok(Array.isArray(result.embassiesConsulates));
  assert.ok(result.embassiesConsulates.length >= 2, "Should include diplomatic missions");

  for (const emb of result.embassiesConsulates) {
    assert.strictEqual(emb.type, "embassy");
    assert.ok(emb.jurisdictionOrCountry && emb.jurisdictionOrCountry.length > 0);
    assert.ok(emb.phone.length > 0);
    assert.ok(emb.address.length > 0);
  }
});

test("Emergency Mode: Resolves Booked Hotel Address & Contacts", async () => {
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId);

  assert.ok(result.hotel, "Hotel info must be defined");
  assert.strictEqual(result.hotel.name, "Taj Fort Aguada Resort & Spa");
  assert.ok(result.hotel.address.includes("Sinquerim, Candolim"));
  assert.strictEqual(result.hotel.phone, "+91 832 664 5858");
  assert.ok((result.hotel.distanceKm ?? 0) >= 0);
});

test("Emergency Mode: Resolves Emergency Contacts from Profile", async () => {
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId);

  assert.ok(Array.isArray(result.emergencyContacts));
  assert.ok(result.emergencyContacts.length >= 1);

  const contact = result.emergencyContacts[0];
  assert.ok(contact.name.length > 0);
  assert.ok(contact.phone.length > 0);
  assert.ok(contact.relationship.length > 0);
});

test("Emergency Mode: Computes Active Wayfinding Route to Nearest Facility", async () => {
  const liveCoords = { latitude: 15.498, longitude: 73.827, accuracy: 12 };
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId, {
    userCoords: liveCoords,
    targetFacilityType: "hospital",
  });

  assert.strictEqual(result.currentLocation.isSimulated, false);
  assert.strictEqual(result.currentLocation.accuracyMeters, 12);
  assert.ok(result.activeRoute, "Active route must be generated");
  assert.strictEqual(result.activeRoute.facilityType, "hospital");
  assert.ok(result.activeRoute.coordinates.length >= 2, "Must contain path coordinates");
  assert.ok(result.activeRoute.distanceKm >= 0);
  assert.ok(result.activeRoute.durationMinutes > 0);
  assert.ok(result.activeRoute.etaTimeString.match(/\d+:\d+ (AM|PM)/));
  assert.ok(result.activeRoute.steps.length >= 2, "Must contain turn-by-turn guidance");
});

test("Emergency Mode: Formats Actionable SOS Location Share Message with Coordinates & Helplines", async () => {
  const liveCoords = { latitude: 15.501, longitude: 73.831 };
  const result = await emergencyModeService.getEmergencyModeData(testTripId, testUserId, {
    userCoords: liveCoords,
  });

  const msg = result.shareableDistressMessage;
  assert.ok(msg.includes("🚨 [EMERGENCY LOCATION SHARE - RIMJHIM ROAMS] 🚨"));
  assert.ok(msg.includes("https://maps.google.com/?q=15.501000,73.831000"));
  assert.ok(msg.includes("Destination: Goa"));
  assert.ok(msg.includes("Taj Fort Aguada"));
  assert.ok(msg.includes("Nearest Hospital:"));
  assert.ok(msg.includes("Nearest Police:"));
  assert.ok(msg.includes("Police 112 | Ambulance 108 | Tourist Helpline 1363"));
  assert.ok(msg.includes("DECISION SUPPORT NOTICE"));
});
