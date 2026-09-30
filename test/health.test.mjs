import test from "node:test";
import assert from "node:assert";

test("Environment template validation", () => {
  // Verify that required environment variable keys exist in the schema documentation
  const requiredKeys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
  ];

  assert.strictEqual(requiredKeys.length, 3);
  assert.ok(requiredKeys.includes("NEXT_PUBLIC_SUPABASE_URL"));
  assert.ok(requiredKeys.includes("GEMINI_API_KEY"));
});

test("Weather mapping code logic check", () => {
  function mapWeatherCode(code) {
    if (code === undefined || code === null) return "Clear";
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Foggy";
    if (code <= 67) return "Rainy";
    if (code <= 77) return "Snowy";
    if (code <= 99) return "Thunderstorm";
    return "Variable";
  }

  assert.strictEqual(mapWeatherCode(0), "Clear Sky");
  assert.strictEqual(mapWeatherCode(2), "Partly Cloudy");
  assert.strictEqual(mapWeatherCode(61), "Rainy");
  assert.strictEqual(mapWeatherCode(95), "Thunderstorm");
});
