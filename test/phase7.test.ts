import test from "node:test";
import assert from "node:assert";
import { destinationDiscoveryEngine } from "@/lib/services/destination-discovery-engine";
import { DestinationDiscoveryInput } from "@/types/discovery";

// ==============================================================================
// Phase 7 Destination Discovery Engine Unit & End-to-End Tests
// ==============================================================================

test("DestinationDiscoveryEngine: Prompt Example — Kolkata, ₹20,000, 5 Days, 3 Friends, Nature + Adventure", async () => {
  const input: DestinationDiscoveryInput = {
    origin: "Kolkata",
    budget: 20000,
    currency: "INR",
    durationDays: 5,
    travellerCount: 3,
    travellerType: "friends",
    preferences: ["Nature", "Adventure"],
  };

  const response = await destinationDiscoveryEngine.discoverDestinations(input);

  assert.strictEqual(response.success, true);
  assert(response.destinations.length >= 2, "Must return multiple feasible destinations");

  // Darjeeling should be among the top options for Kolkata + Nature + Adventure
  const darjeeling = response.destinations.find(
    (d) => d.destination.name.toLowerCase() === "darjeeling"
  );
  assert(darjeeling !== undefined, "Darjeeling should be discovered for Kolkata departure");
  assert(darjeeling.matchScore >= 80, "Nature + Adventure should yield high match score for Darjeeling");

  // Verify all required output fields for every destination
  for (const item of response.destinations) {
    assert(item.destination.name.length > 0);
    assert(item.estimatedTotalCost > 0);
    assert(typeof item.estimatedTotalCostFormatted === "string");
    assert(typeof item.transportCost === "number");
    assert(typeof item.hotelCost === "number");
    assert(typeof item.foodCost === "number");
    assert(typeof item.activitiesCost === "number");
    assert(typeof item.localTransportCost === "number");
    assert(typeof item.emergencyBufferCost === "number");
    assert(typeof item.recommendedDays === "number");
    assert(typeof item.approximateTravelTime === "string");
    assert(item.majorAttractions.length > 0);
    assert(item.isEstimate === true);
    assert(item.estimateDisclaimer.length > 0);
  }
});

test("DestinationDiscoveryEngine: Strict integration with BudgetEngine (No arithmetic drift)", async () => {
  const input: DestinationDiscoveryInput = {
    origin: "Delhi",
    budget: 25000,
    currency: "INR",
    durationDays: 4,
    travellerCount: 2,
    travellerType: "couple",
    preferences: ["Heritage", "Culture"],
  };

  const response = await destinationDiscoveryEngine.discoverDestinations(input);
  assert(response.destinations.length > 0);

  for (const dest of response.destinations) {
    const sumCategories =
      dest.transportCost +
      dest.hotelCost +
      dest.foodCost +
      dest.localTransportCost +
      dest.activitiesCost +
      dest.emergencyBufferCost;

    // Must match total cost exactly without floating point drift
    assert.strictEqual(
      sumCategories,
      dest.estimatedTotalCost,
      `Category sum (${sumCategories}) must match estimatedTotalCost (${dest.estimatedTotalCost})`
    );
  }
});

test("DestinationDiscoveryEngine: Filters out origin city from candidate destinations", async () => {
  const responseFromGoa = await destinationDiscoveryEngine.discoverDestinations({
    origin: "Goa",
    budget: 30000,
    currency: "INR",
    durationDays: 3,
    travellerCount: 2,
    travellerType: "couple",
    preferences: ["Beach"],
  });

  const hasGoa = responseFromGoa.destinations.some(
    (d) => d.destination.name.toLowerCase() === "goa"
  );
  assert.strictEqual(hasGoa, false, "Origin city Goa must not be suggested as a destination");
});

test("DestinationDiscoveryEngine: Infeasible destinations are filtered when budget is too tight", async () => {
  // Extremely tight budget: ₹6,000 for 5 days for 4 people
  const response = await destinationDiscoveryEngine.discoverDestinations({
    origin: "Kolkata",
    budget: 6000,
    currency: "INR",
    durationDays: 5,
    travellerCount: 4,
    travellerType: "friends",
    preferences: ["Adventure"],
  });

  // Most distant/expensive destinations (e.g. Goa, Manali requiring flights/long travel) must be filtered
  const hasGoa = response.destinations.some(
    (d) => d.destination.name.toLowerCase() === "goa"
  );
  assert.strictEqual(hasGoa, false, "Goa should be filtered out for ₹6,000 budget for 4 people over 5 days");
});

test("DestinationDiscoveryEngine: Preference scoring differentiates thematic interests", async () => {
  const natureResponse = await destinationDiscoveryEngine.discoverDestinations({
    origin: "Delhi",
    budget: 35000,
    currency: "INR",
    durationDays: 4,
    travellerCount: 2,
    travellerType: "couple",
    preferences: ["Nature", "Mountains"],
  });

  const heritageResponse = await destinationDiscoveryEngine.discoverDestinations({
    origin: "Delhi",
    budget: 35000,
    currency: "INR",
    durationDays: 4,
    travellerCount: 2,
    travellerType: "couple",
    preferences: ["Heritage", "Culture"],
  });

  // Nature preferences should score Darjeeling or Manali high
  const mountainScoreNature = natureResponse.destinations.find(
    (d) => d.destination.name.toLowerCase() === "manali" || d.destination.name.toLowerCase() === "darjeeling"
  )?.matchScore ?? 0;

  // Heritage preferences should score Jaipur high
  const jaipurScoreHeritage = heritageResponse.destinations.find(
    (d) => d.destination.name.toLowerCase() === "jaipur"
  )?.matchScore ?? 0;

  assert(mountainScoreNature >= 80, "Mountain destination should score high for Nature preferences");
  assert(jaipurScoreHeritage >= 80, "Jaipur should score high for Heritage preferences");
});

test("DestinationDiscoveryEngine: Weather information is attached with valid fields", async () => {
  const response = await destinationDiscoveryEngine.discoverDestinations({
    origin: "Mumbai",
    budget: 30000,
    currency: "INR",
    durationDays: 3,
    travellerCount: 2,
    travellerType: "couple",
    preferences: ["Beaches"],
  });

  for (const dest of response.destinations) {
    if (dest.weather) {
      assert(typeof dest.weather.currentTemp === "number");
      assert(typeof dest.weather.condition === "string");
      assert(typeof dest.weather.precipitationProbability === "number");
      assert(dest.weather.unit === "°C");
    }
  }
});
