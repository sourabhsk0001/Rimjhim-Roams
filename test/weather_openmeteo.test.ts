import test from "node:test";
import assert from "node:assert";
import { openMeteoWeatherProvider, parseAirQuality, computeSuitability, computeSummaryAdvisory } from "@/lib/weather/provider";
import { tripPlannerService } from "@/lib/services/trip-planner-service";

test("Open-Meteo: Air Quality parser correctly categorizes AQI and generates advisories", () => {
  const goodAqi = parseAirQuality(35, 8.5, 18);
  assert.strictEqual(goodAqi.category, "Good");
  assert.strictEqual(goodAqi.aqiUs, 35);
  assert.strictEqual(goodAqi.pm2_5, 8.5);
  assert.strictEqual(goodAqi.pm10, 18);
  assert(goodAqi.advisory.includes("Ideal") || goodAqi.advisory.includes("Pristine"));

  const moderateAqi = parseAirQuality(75, 22.0, 45);
  assert.strictEqual(moderateAqi.category, "Moderate");
  assert.strictEqual(moderateAqi.aqiUs, 75);

  const sensitiveAqi = parseAirQuality(130, 48.0, 95);
  assert.strictEqual(sensitiveAqi.category, "Sensitive");

  const unhealthyAqi = parseAirQuality(185, 92.0, 160);
  assert.strictEqual(unhealthyAqi.category, "Unhealthy");
});

test("Open-Meteo: Activity Suitability Matrix generates valid travel activity scores and badges", () => {
  const clearCurrent = {
    temperature: 24,
    apparentTemperature: 24,
    condition: "Clear Sky",
    weatherCode: 0,
    windSpeed: 12,
    windDirection: 180,
    precipitationProbability: 0,
    humidity: 55,
    uvIndex: 5,
    time: "2026-11-01T12:00",
    isDay: true,
  };
  const clearDaily = [
    {
      date: "2026-11-01",
      tempMin: 20,
      tempMax: 26,
      condition: "Clear Sky",
      precipitationProbability: 0,
      precipitationSum: 0,
      windSpeedMax: 10,
      sunrise: "06:00",
      sunset: "18:00",
      weatherCode: 0,
      confidenceTier: "high_confidence" as const,
    },
  ];
  const clearAqi = { aqiUs: 35, aqiEu: 15, pm2_5: 8, pm10: 16, category: "Good" as const, advisory: "Clean air" };

  const clearSuitability = computeSuitability(clearCurrent, clearDaily, clearAqi);
  assert(clearSuitability.length >= 5);

  const sightseeing = clearSuitability.find((s) => s.category === "outdoor_sightseeing");
  assert(sightseeing !== undefined);
  assert(sightseeing.score >= 80);
  assert.strictEqual(sightseeing.status, "Optimal");
  assert.strictEqual(sightseeing.badgeColor, "emerald");

  // Heavy rain day
  const rainyCurrent = {
    temperature: 22,
    apparentTemperature: 22,
    condition: "Heavy Rain",
    weatherCode: 65,
    windSpeed: 25,
    windDirection: 210,
    precipitationProbability: 90,
    humidity: 95,
    uvIndex: 2,
    time: "2026-11-01T12:00",
    isDay: true,
  };
  const rainyDaily = [
    {
      date: "2026-11-01",
      tempMin: 19,
      tempMax: 23,
      condition: "Heavy Rain",
      precipitationProbability: 90,
      precipitationSum: 45,
      windSpeedMax: 30,
      sunrise: "06:00",
      sunset: "18:00",
      weatherCode: 65,
      confidenceTier: "high_confidence" as const,
    },
  ];
  const rainySuitability = computeSuitability(rainyCurrent, rainyDaily, clearAqi);
  const indoor = rainySuitability.find((s) => s.category === "indoor_heritage");
  const beach = rainySuitability.find((s) => s.category === "beach_water");
  assert(indoor !== undefined);
  assert(beach !== undefined);
  assert(indoor.score > beach.score, "Indoor activities must score higher than beach in rain");
  assert(beach.score <= 40);
});

test("Open-Meteo: Summary advisory synthesizes actionable travel guidance", () => {
  const dummyCurrentRain = {
    temperature: 24,
    apparentTemperature: 24,
    condition: "Rainy",
    weatherCode: 61,
    windSpeed: 10,
    windDirection: 180,
    precipitationProbability: 75,
    humidity: 85,
    uvIndex: 3,
    time: "2026-11-01T12:00",
    isDay: true,
  };
  const dummyDailyRain = [
    {
      date: "2026-11-01",
      tempMin: 20,
      tempMax: 25,
      condition: "Rainy",
      precipitationProbability: 75,
      precipitationSum: 15,
      windSpeedMax: 15,
      sunrise: "06:00",
      sunset: "18:00",
      weatherCode: 61,
      confidenceTier: "high_confidence" as const,
    },
  ];

  const rainAdvisory = computeSummaryAdvisory(dummyCurrentRain, dummyDailyRain, "Goa", {
    aqiUs: 45,
    aqiEu: 20,
    pm2_5: 10,
    pm10: 20,
    category: "Good",
    advisory: "Clean air",
  });
  assert(rainAdvisory.includes("precipitation") || rainAdvisory.includes("indoor"));

  const dummyCurrentHeat = {
    temperature: 38,
    apparentTemperature: 41,
    condition: "Sunny",
    weatherCode: 0,
    windSpeed: 8,
    windDirection: 90,
    precipitationProbability: 5,
    humidity: 45,
    uvIndex: 9,
    time: "2026-11-01T12:00",
    isDay: true,
  };
  const dummyDailyHeat = [
    {
      date: "2026-11-01",
      tempMin: 28,
      tempMax: 39,
      condition: "Clear Sky",
      precipitationProbability: 5,
      precipitationSum: 0,
      windSpeedMax: 12,
      sunrise: "06:00",
      sunset: "18:00",
      weatherCode: 0,
      confidenceTier: "high_confidence" as const,
    },
  ];

  const heatAdvisory = computeSummaryAdvisory(dummyCurrentHeat, dummyDailyHeat, "Jaipur", {
    aqiUs: 55,
    aqiEu: 25,
    pm2_5: 15,
    pm10: 30,
    category: "Moderate",
    advisory: "Acceptable",
  });
  assert(heatAdvisory.includes("heat") || heatAdvisory.includes("Hydrate"));
});

test("Open-Meteo: Forecast generation attaches air quality and suitability telemetry", async () => {
  const forecast = await openMeteoWeatherProvider.getForecast(
    15.2993, // Goa
    74.124,
    3,
    "Goa"
  );

  assert(forecast !== undefined);
  assert(forecast.daily.length >= 3);
  assert(forecast.airQuality !== undefined);
  assert(typeof forecast.airQuality.aqiUs === "number");
  assert(forecast.suitability !== undefined);
  assert(forecast.suitability.length >= 5);
  assert(typeof forecast.summaryAdvisory === "string");
  assert(forecast.summaryAdvisory.length > 0);
});

test("TripPlannerService: Integrates Open-Meteo weather intelligence into generated trip result", async () => {
  const plan = await tripPlannerService.generateCompletePlan({
    tripId: "test-trip-weather-integrated",
    userId: "test-user-weather",
    origin: "Mumbai",
    destination: "Goa",
    startDate: "2026-11-01",
    durationDays: 3,
    budget: 30000,
    travellerCount: 2,
    travellerType: "couple",
    travelPace: "moderate",
  });

  // Verify weather forecast is attached to complete plan
  assert(plan.weatherForecast !== undefined, "Plan must contain weatherForecast");
  assert(plan.weatherForecast.airQuality !== undefined, "Plan weather must contain airQuality");
  assert(plan.weatherForecast.suitability !== undefined, "Plan weather must contain suitability");

  // Verify each planned day has daily weather attached
  assert(plan.itinerary.length === 3);
  for (const day of plan.itinerary) {
    assert(day.weather !== undefined, `Day ${day.dayNumber} must have daily weather attached`);
    assert(typeof day.weather.tempMin === "number");
    assert(typeof day.weather.tempMax === "number");
    assert(typeof day.weather.precipitationProbability === "number");
    assert(typeof day.weather.condition === "string");
  }

  // Verify planning steps completed
  assert(plan.planningSteps.every((s) => s.completed === true));
});
