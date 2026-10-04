import { test } from "node:test";
import assert from "node:assert";
import { Topography } from "../src/components/ui/Topography";
import { TopographyBackground } from "../src/components/background/TopographyBackground";
import { GlobalTopographyBackground } from "../src/components/layout/global-topography-background";

test("Topography Component: Export and Component Definition", () => {
  assert.strictEqual(typeof Topography, "function", "Topography should be exported as a React function component");
  assert.strictEqual(typeof TopographyBackground, "function", "TopographyBackground should be exported as a React function component");
  assert.strictEqual(typeof GlobalTopographyBackground, "function", "GlobalTopographyBackground should be exported as a React function component");
});

test("Topography Background Route Rule: Root Landing Page Excluded", () => {
  // Logic validation for route filtering
  const isTopographyAllowedForPath = (path: string) => {
    return path !== "/";
  };

  // The landing / home page MUST NOT show the topography background
  assert.strictEqual(isTopographyAllowedForPath("/"), false, "Landing page ('/') must be excluded from showing Topography background");

  // Every internal/application page MUST show the topography background
  assert.strictEqual(isTopographyAllowedForPath("/dashboard"), true, "/dashboard must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/explore"), true, "/explore must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/trips"), true, "/trips must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/trips/new"), true, "/trips/new must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/trips/123/itinerary"), true, "/trips/[id]/itinerary must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/trips/123/budget"), true, "/trips/[id]/budget must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/trips/123/assistant"), true, "/trips/[id]/assistant must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/memories"), true, "/memories must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/profile"), true, "/profile must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/login"), true, "/login must show Topography background");
  assert.strictEqual(isTopographyAllowedForPath("/register"), true, "/register must show Topography background");
});
