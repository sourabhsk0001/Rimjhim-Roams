import test from "node:test";
import assert from "node:assert";
import { placeComfortService } from "../src/lib/services/place-comfort-service";

test("Place Comfort: Returns full profile with all 5 discrete public signals", () => {
  const profile = placeComfortService.getPlaceComfortProfile({
    placeName: "Amber Fort",
    destination: "Jaipur",
    category: "Historical Monument",
  });

  assert.ok(profile, "Profile must be defined");
  assert.ok(profile.placeName.includes("Amber Fort"));
  assert.strictEqual(profile.destination, "Jaipur");
  assert.ok(profile.areaName.includes("Amber Fort"));

  // Must contain exactly the 5 requested transparent signals
  assert.strictEqual(profile.signals.length, 5, "Must contain exactly 5 signals");

  const signalIds = profile.signals.map((s) => s.id);
  assert.ok(signalIds.includes("crowd_level"), "Must contain crowd_level signal");
  assert.ok(signalIds.includes("late_night_access"), "Must contain late_night_access signal");
  assert.ok(signalIds.includes("transport"), "Must contain transport signal");
  assert.ok(signalIds.includes("tourist_density"), "Must contain tourist_density signal");
  assert.ok(signalIds.includes("weather_concern"), "Must contain weather_concern signal");

  // Validate signal fields
  for (const signal of profile.signals) {
    assert.ok(["green", "yellow", "red"].includes(signal.level));
    assert.ok(["🟢", "🟡", "🔴"].includes(signal.iconEmoji));
    assert.ok(signal.statusText && signal.statusText.length > 0, `Signal ${signal.id} statusText: ${signal.statusText}`);
    assert.ok(signal.detail && signal.detail.length > 0, `Signal ${signal.id} detail: ${signal.detail}`);
    assert.ok(signal.source && signal.source.length > 0, `Signal ${signal.id} source: ${signal.source}`);
    assert.ok(signal.retrieved_at && signal.retrieved_at.length > 0);
  }
});

test("Place Comfort: Recommends realistic 'Better time to visit' window with operational rationale", () => {
  const profile = placeComfortService.getPlaceComfortProfile({
    placeName: "Amber Fort",
    destination: "Jaipur",
    category: "Historical Monument",
  });

  const better = profile.betterTimeToVisit;
  assert.ok(better, "betterTimeToVisit must be defined");
  assert.ok(better.timeWindow.length > 0);
  assert.ok(better.timeWindow.includes("AM") || better.timeWindow.includes("PM"));
  assert.ok(better.reason.length > 0);
  assert.ok(better.crowdContext.length > 0);
  assert.ok(better.illuminationContext.length > 0);
});

test("Place Comfort: Adheres to 'No Arbitrary Safety Scores' transparency invariant", () => {
  const profile = placeComfortService.getPlaceComfortProfile({
    placeName: "Qutub Minar",
    destination: "Delhi",
  });

  // Strict Invariant: No numerical single safety score pretending authoritative judgment
  assert.strictEqual((profile as any).safetyScore, undefined, "Must NOT have arbitrary numerical safety score");
  assert.strictEqual((profile as any).score, undefined);

  // Transparency notice
  assert.strictEqual(profile.transparencyNotice.rule, "No Arbitrary Safety Scores");
  assert.strictEqual(profile.transparencyNotice.isDecisionSupportOnly, true);
  assert.ok(profile.transparencyNotice.description.includes("black-box AI"));

  // Verified Public Sources citations
  assert.ok(Array.isArray(profile.verifiedSources));
  assert.ok(profile.verifiedSources.length >= 3);
  const authorities = profile.verifiedSources.map((s) => s.name);
  assert.ok(authorities.some((a) => a.includes("Archaeological Survey of India")));
  assert.ok(authorities.some((a) => a.includes("OpenStreetMap")));
});

test("Place Comfort: Distinct profiles for Monuments vs Coastal Beaches vs Urban Markets", () => {
  // 1. Heritage Fort
  const fortProfile = placeComfortService.getPlaceComfortProfile({
    placeName: "Aguada Fort & Lighthouse",
    destination: "Goa",
    category: "Historical Monument",
  });
  const fortLateNight = fortProfile.signals.find((s) => s.id === "late_night_access");
  assert.ok(fortLateNight);
  assert.strictEqual(fortLateNight.level, "yellow");
  assert.ok(fortLateNight.detail.includes("Sunset") || fortLateNight.detail.includes("close"));

  // 2. Coastal Beach
  const beachProfile = placeComfortService.getPlaceComfortProfile({
    placeName: "Calangute & Baga Beach",
    destination: "Goa",
    category: "Nature & Beach",
  });
  const beachCrowd = beachProfile.signals.find((s) => s.id === "crowd_level");
  assert.ok(beachCrowd);
  assert.strictEqual(beachCrowd.level, "green");
  assert.ok(beachProfile.betterTimeToVisit.timeWindow.includes("PM"));

  // 3. Urban Commercial Corridor
  const marketProfile = placeComfortService.getPlaceComfortProfile({
    placeName: "Colaba Causeway Market",
    destination: "Mumbai",
    category: "Shopping & Market",
  });
  const marketNight = marketProfile.signals.find((s) => s.id === "late_night_access");
  assert.ok(marketNight);
  assert.strictEqual(marketNight.level, "green");
  assert.ok(marketNight.statusText.includes("Commercial"));
});
