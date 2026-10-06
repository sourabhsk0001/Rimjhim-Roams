import {
  CurrentWeather,
  DailyWeather,
  HourlyWeather,
  WeatherForecastResponse,
  HistoricalWeatherResponse,
  WeatherConfidenceTier,
  AirQualityData,
  ActivityWeatherSuitability,
} from "@/types/weather";

export interface WeatherProvider {
  readonly name: string;
  getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeather>;
  getForecast(
    latitude: number,
    longitude: number,
    days?: number,
    locationName?: string
  ): Promise<WeatherForecastResponse>;
  getHistoricalDataIfAvailable(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    locationName?: string
  ): Promise<HistoricalWeatherResponse[]>;
  getAirQuality?(
    latitude: number,
    longitude: number
  ): Promise<AirQualityData>;
}

export class OpenMeteoWeatherProvider implements WeatherProvider {
  readonly name = "Open-Meteo";
  private readonly defaultTimeoutMs = 2500;

  /**
   * Fetches current real-time weather conditions
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number
  ): Promise<CurrentWeather> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&timezone=auto`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo returned status ${res.status}`);
      }

      const data = await res.json();
      const current = data.current || {};

      return {
        temperature: Math.round((current.temperature_2m ?? 24) * 10) / 10,
        apparentTemperature:
          Math.round((current.apparent_temperature ?? current.temperature_2m ?? 25) * 10) / 10,
        condition: mapWeatherCode(current.weather_code),
        weatherCode: current.weather_code ?? 0,
        windSpeed: Math.round((current.wind_speed_10m ?? 12) * 10) / 10,
        windDirection: current.wind_direction_10m ?? 180,
        precipitationProbability: 0,
        humidity: current.relative_humidity_2m ?? 55,
        uvIndex: 4,
        time: current.time || new Date().toISOString(),
        isDay: current.is_day === 1,
      };
    } catch {
      // Graceful fallback to safe climatological baseline
      return this.generateFallbackCurrent(latitude);
    }
  }

  /**
   * Fetches real-time Air Quality observations from Open-Meteo Air Quality API
   */
  async getAirQuality(
    latitude: number,
    longitude: number
  ): Promise<AirQualityData> {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,us_aqi,pm10,pm2_5&timezone=auto`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo Air Quality returned status ${res.status}`);
      }

      const data = await res.json();
      const current = data.current || {};
      const usAqi = current.us_aqi ?? 52;
      const pm2_5 = current.pm2_5 ?? 15.4;
      const pm10 = current.pm10 ?? 28.6;

      return parseAirQuality(usAqi, pm2_5, pm10);
    } catch {
      return this.generateFallbackAirQuality(latitude);
    }
  }

  /**
   * Fetches multi-day hourly and daily weather forecast
   */
  async getForecast(
    latitude: number,
    longitude: number,
    days: number = 7,
    locationName: string = "Destination"
  ): Promise<WeatherForecastResponse> {
    const forecastDays = Math.min(14, Math.max(1, days));
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&forecast_days=${forecastDays}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m,uv_index,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset&timezone=auto`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo returned status ${res.status}`);
      }

      const data = await res.json();
      const currentRaw = data.current || {};
      const dailyRaw = data.daily || {};
      const hourlyRaw = data.hourly || {};

      const current: CurrentWeather = {
        temperature: Math.round((currentRaw.temperature_2m ?? 25) * 10) / 10,
        apparentTemperature:
          Math.round(
            (currentRaw.apparent_temperature ?? currentRaw.temperature_2m ?? 26) * 10
          ) / 10,
        condition: mapWeatherCode(currentRaw.weather_code),
        weatherCode: currentRaw.weather_code ?? 0,
        windSpeed: Math.round((currentRaw.wind_speed_10m ?? 12) * 10) / 10,
        windDirection: currentRaw.wind_direction_10m ?? 180,
        precipitationProbability:
          hourlyRaw.precipitation_probability?.[0] ?? 10,
        humidity: currentRaw.relative_humidity_2m ?? 60,
        uvIndex: hourlyRaw.uv_index?.[12] ?? 5,
        time: currentRaw.time || new Date().toISOString(),
        isDay: currentRaw.is_day === 1,
      };

      const daily: DailyWeather[] = (dailyRaw.time || []).map(
        (dateStr: string, idx: number) => {
          const confidenceTier = this.calculateConfidenceTier(idx);
          return {
            date: dateStr,
            tempMin: Math.round(dailyRaw.temperature_2m_min?.[idx] ?? 18),
            tempMax: Math.round(dailyRaw.temperature_2m_max?.[idx] ?? 29),
            condition: mapWeatherCode(dailyRaw.weather_code?.[idx]),
            precipitationProbability:
              dailyRaw.precipitation_probability_max?.[idx] ?? 15,
            precipitationSum:
              Math.round((dailyRaw.precipitation_sum?.[idx] ?? 0) * 10) / 10,
            windSpeedMax:
              Math.round((dailyRaw.wind_speed_10m_max?.[idx] ?? 14) * 10) / 10,
            sunrise: dailyRaw.sunrise?.[idx] || `${dateStr}T06:15`,
            sunset: dailyRaw.sunset?.[idx] || `${dateStr}T18:30`,
            weatherCode: dailyRaw.weather_code?.[idx] ?? 0,
            confidenceTier,
          };
        }
      );

      const hourly: HourlyWeather[] = (hourlyRaw.time || []).map(
        (timeStr: string, idx: number) => {
          const hour = parseInt(timeStr.substring(11, 13) || "0", 10);
          return {
            time: timeStr,
            hour,
            temperature: Math.round((hourlyRaw.temperature_2m?.[idx] ?? 22) * 10) / 10,
            apparentTemperature:
              Math.round((hourlyRaw.apparent_temperature?.[idx] ?? 23) * 10) / 10,
            precipitationProbability:
              hourlyRaw.precipitation_probability?.[idx] ?? 10,
            precipitation:
              Math.round((hourlyRaw.precipitation?.[idx] ?? 0) * 10) / 10,
            weatherCode: hourlyRaw.weather_code?.[idx] ?? 0,
            condition: mapWeatherCode(hourlyRaw.weather_code?.[idx]),
            windSpeed:
              Math.round((hourlyRaw.wind_speed_10m?.[idx] ?? 10) * 10) / 10,
            windDirection: 180,
            humidity: hourlyRaw.relative_humidity_2m?.[idx] ?? 55,
            uvIndex: hourlyRaw.uv_index?.[idx] ?? 0,
            isDay: hourlyRaw.is_day?.[idx] === 1,
          };
        }
      );

      // Enrich with Open-Meteo Air Quality in parallel
      let airQuality: AirQualityData;
      try {
        airQuality = await this.getAirQuality(latitude, longitude);
      } catch {
        airQuality = this.generateFallbackAirQuality(latitude);
      }

      const suitability = computeSuitability(current, daily, airQuality);
      const summaryAdvisory = computeSummaryAdvisory(current, daily, locationName, airQuality);

      return {
        locationName,
        latitude,
        longitude,
        timezone: data.timezone || "auto",
        current,
        daily,
        hourly,
        airQuality,
        suitability,
        summaryAdvisory,
        isCached: false,
        isFallback: false,
        fetchedAt: new Date().toISOString(),
        provider: "Open-Meteo",
        disclaimer:
          "Forecasts are probabilistic atmospheric models. For mountainous, nautical, or storm conditions, always monitor live local civil advisories.",
      };
    } catch {
      // Graceful offline/timeout fallback
      return this.generateFallbackForecast(latitude, longitude, days, locationName);
    }
  }

  /**
   * Fetches historical weather observations or falls back to climatological averages
   */
  async getHistoricalDataIfAvailable(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    locationName: string = "Destination"
  ): Promise<HistoricalWeatherResponse[]> {
    const today = new Date().toISOString().substring(0, 10);

    // If requested date is in the future, return climatological estimate
    if (startDate >= today) {
      return this.generateClimatologicalHistory(
        latitude,
        longitude,
        startDate,
        endDate,
        locationName
      );
    }

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(this.defaultTimeoutMs),
      });

      if (!res.ok) {
        throw new Error(`Open-Meteo Archive returned ${res.status}`);
      }

      const data = await res.json();
      const daily = data.daily || {};

      return (daily.time || []).map((date: string, idx: number) => ({
        locationName,
        latitude,
        longitude,
        date,
        tempMin: Math.round(daily.temperature_2m_min?.[idx] ?? 16),
        tempMax: Math.round(daily.temperature_2m_max?.[idx] ?? 28),
        condition: mapWeatherCode(daily.weather_code?.[idx]),
        precipitation: Math.round((daily.precipitation_sum?.[idx] ?? 0) * 10) / 10,
        windSpeedMax: Math.round((daily.wind_speed_10m_max?.[idx] ?? 12) * 10) / 10,
        weatherCode: daily.weather_code?.[idx] ?? 0,
        source: "historical_api" as const,
      }));
    } catch {
      return this.generateClimatologicalHistory(
        latitude,
        longitude,
        startDate,
        endDate,
        locationName
      );
    }
  }

  // ============================================================================
  // Private Helper & Fallback Methods
  // ============================================================================

  private calculateConfidenceTier(dayIndex: number): WeatherConfidenceTier {
    if (dayIndex <= 2) return "high_confidence";
    if (dayIndex <= 7) return "moderate_confidence";
    return "seasonal_guidance";
  }

  private generateFallbackCurrent(latitude: number): CurrentWeather {
    const isTropical = latitude < 20;
    const isAlpine = latitude > 26;

    const baseTemp = isTropical ? 28 : isAlpine ? 16 : 24;

    return {
      temperature: baseTemp,
      apparentTemperature: baseTemp + 1,
      condition: "Clear Sky",
      weatherCode: 0,
      windSpeed: 10.5,
      windDirection: 210,
      precipitationProbability: 10,
      humidity: 50,
      uvIndex: 5,
      time: new Date().toISOString(),
      isDay: true,
    };
  }

  private generateFallbackForecast(
    latitude: number,
    longitude: number,
    days: number,
    locationName: string
  ): WeatherForecastResponse {
    const isTropical = latitude < 20;
    const isAlpine = latitude > 26;
    const baseTemp = isTropical ? 28 : isAlpine ? 15 : 24;

    const today = new Date();
    const daily: DailyWeather[] = [];
    const hourly: HourlyWeather[] = [];

    for (let d = 0; d < days; d++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + d);
      const dateStr = targetDate.toISOString().substring(0, 10);
      const confidenceTier = this.calculateConfidenceTier(d);

      daily.push({
        date: dateStr,
        tempMin: baseTemp - 6,
        tempMax: baseTemp + 4,
        condition: d % 4 === 0 ? "Partly Cloudy" : "Clear Sky",
        precipitationProbability: d % 3 === 0 ? 25 : 10,
        precipitationSum: 0,
        windSpeedMax: 12.5,
        sunrise: `${dateStr}T06:15`,
        sunset: `${dateStr}T18:25`,
        weatherCode: 0,
        confidenceTier,
      });

      // Generate 24 hours for each day
      for (let h = 0; h < 24; h++) {
        const hourStr = h < 10 ? `0${h}` : `${h}`;
        const timeStr = `${dateStr}T${hourStr}:00`;
        const tempVariation = Math.round(Math.sin(((h - 8) / 12) * Math.PI) * 5);
        const temp = baseTemp + tempVariation;
        const isDaytime = h >= 6 && h <= 18;

        hourly.push({
          time: timeStr,
          hour: h,
          temperature: temp,
          apparentTemperature: temp + 1,
          precipitationProbability: d % 3 === 0 && h === 15 ? 40 : 10,
          precipitation: 0,
          weatherCode: 0,
          condition: "Clear Sky",
          windSpeed: 10.0,
          windDirection: 180,
          humidity: isDaytime ? 50 : 70,
          uvIndex: isDaytime ? Math.max(0, 8 - Math.abs(h - 12)) : 0,
          isDay: isDaytime,
        });
      }
    }

    const current = this.generateFallbackCurrent(latitude);
    const airQuality = this.generateFallbackAirQuality(latitude);
    const suitability = computeSuitability(current, daily, airQuality);
    const summaryAdvisory = computeSummaryAdvisory(current, daily, locationName, airQuality);

    return {
      locationName,
      latitude,
      longitude,
      timezone: "auto",
      current,
      daily,
      hourly,
      airQuality,
      suitability,
      summaryAdvisory,
      isCached: false,
      isFallback: true,
      fetchedAt: new Date().toISOString(),
      provider: "Climatology Fallback",
      disclaimer:
        "Indicative seasonal climatology utilized due to network latency. Safe seasonal projections applied.",
    };
  }

  generateFallbackAirQuality(latitude: number): AirQualityData {
    const isCoastal = latitude < 18;
    const baseAqi = isCoastal ? 45 : 75;
    return parseAirQuality(baseAqi, isCoastal ? 12.5 : 28.0, isCoastal ? 25.0 : 54.0);
  }

  private generateClimatologicalHistory(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    locationName: string
  ): HistoricalWeatherResponse[] {
    const isTropical = latitude < 20;
    const isAlpine = latitude > 26;
    const baseTemp = isTropical ? 28 : isAlpine ? 16 : 24;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const results: HistoricalWeatherResponse[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      const dateStr = curr.toISOString().substring(0, 10);
      results.push({
        locationName,
        latitude,
        longitude,
        date: dateStr,
        tempMin: baseTemp - 5,
        tempMax: baseTemp + 5,
        condition: "Partly Cloudy",
        precipitation: 0.5,
        windSpeedMax: 11.2,
        weatherCode: 2,
        source: "climatological_average",
      });
      curr.setDate(curr.getDate() + 1);
    }

    return results;
  }
}

/**
 * Categorizes US AQI index and provides actionable travel guidance
 */
export function parseAirQuality(
  usAqi: number,
  pm2_5: number,
  pm10: number
): AirQualityData {
  let category: AirQualityData["category"] = "Good";
  let advisory = "Air quality is satisfactory. Excellent for open-air explorations.";

  if (usAqi <= 50) {
    category = "Good";
    advisory = "Pristine air quality. Ideal for all outdoor trails, promenades, and sights.";
  } else if (usAqi <= 100) {
    category = "Moderate";
    advisory = "Air quality is acceptable. Unusually sensitive travelers should monitor strenuous pacing.";
  } else if (usAqi <= 150) {
    category = "Sensitive";
    advisory = "Members of sensitive groups may experience mild fatigue. Consider indoor museum breaks midday.";
  } else if (usAqi <= 200) {
    category = "Unhealthy";
    advisory = "General public may experience discomfort. Prioritize indoor cultural destinations.";
  } else if (usAqi <= 300) {
    category = "Very Unhealthy";
    advisory = "Health alert: high particulate matter. Limit outdoor treks and wear protective masks.";
  } else {
    category = "Hazardous";
    advisory = "Health warning of emergency atmospheric conditions. Stay indoors where possible.";
  }

  return {
    aqiUs: Math.round(usAqi),
    pm2_5: Math.round(pm2_5 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    category,
    advisory,
  };
}

/**
 * Computes destination activity suitability matrix from Open-Meteo atmospheric variables
 */
export function computeSuitability(
  current: CurrentWeather,
  daily: DailyWeather[],
  airQuality?: AirQualityData
): ActivityWeatherSuitability[] {
  const avgTemp = current.temperature;
  const rainChance = Math.max(
    current.precipitationProbability,
    daily[0]?.precipitationProbability ?? 0
  );
  const aqiVal = airQuality?.aqiUs ?? 50;

  // 1. Outdoor Sightseeing & Walking
  let outdoorScore = 90;
  if (rainChance > 35) outdoorScore -= (rainChance - 35) * 1.3;
  if (avgTemp > 35) outdoorScore -= (avgTemp - 35) * 4;
  if (avgTemp < 10) outdoorScore -= (10 - avgTemp) * 3;
  if (aqiVal > 100) outdoorScore -= (aqiVal - 100) * 0.25;
  outdoorScore = Math.max(15, Math.min(100, Math.round(outdoorScore)));

  // 2. Beach & Coastal Recreation
  let beachScore = 85;
  if (avgTemp < 22) beachScore -= (22 - avgTemp) * 4;
  if (avgTemp > 38) beachScore -= (avgTemp - 38) * 3;
  if (rainChance > 25) beachScore -= (rainChance - 25) * 1.5;
  if (current.windSpeed > 28) beachScore -= 20;
  beachScore = Math.max(10, Math.min(100, Math.round(beachScore)));

  // 3. Mountain Trekking & Hiking
  let trekScore = 88;
  if (rainChance > 20) trekScore -= (rainChance - 20) * 1.8;
  if (current.windSpeed > 32) trekScore -= 25;
  if (avgTemp < 5 || avgTemp > 36) trekScore -= 25;
  trekScore = Math.max(10, Math.min(100, Math.round(trekScore)));

  // 4. Indoor Museums & Heritage Palaces
  let indoorScore = 92;
  if (rainChance > 45 || avgTemp > 35 || aqiVal > 130) indoorScore = 100;

  // 5. Sunset & Golden Hour Photography
  let photoScore = 85;
  if (rainChance > 30) photoScore -= (rainChance - 30) * 1.5;
  if (current.humidity > 85) photoScore -= 15;
  photoScore = Math.max(20, Math.min(100, Math.round(photoScore)));

  const getStatus = (score: number) => {
    if (score >= 80) return { status: "Optimal" as const, color: "emerald" };
    if (score >= 65) return { status: "Suitable" as const, color: "blue" };
    if (score >= 50) return { status: "Fair" as const, color: "amber" };
    if (score >= 35) return { status: "Challenging" as const, color: "orange" };
    return { status: "Not Recommended" as const, color: "rose" };
  };

  const outStat = getStatus(outdoorScore);
  const bchStat = getStatus(beachScore);
  const trkStat = getStatus(trekScore);
  const indStat = getStatus(indoorScore);
  const phtStat = getStatus(photoScore);

  return [
    {
      category: "outdoor_sightseeing",
      label: "Sightseeing & City Walks",
      score: outdoorScore,
      status: outStat.status,
      badgeColor: outStat.color,
      tips:
        outdoorScore >= 75
          ? "Pleasant temperature and clear paths. Ideal for outdoor monuments."
          : "Moderate conditions. Schedule walking early in the morning or late afternoon.",
    },
    {
      category: "beach_water",
      label: "Beaches & Water Sports",
      score: beachScore,
      status: bchStat.status,
      badgeColor: bchStat.color,
      tips:
        beachScore >= 75
          ? "Warm sea breeze and sunny skies. Great for coastal leisure."
          : "Check local surf flags; afternoon wind or precipitation may reduce comfort.",
    },
    {
      category: "mountain_trekking",
      label: "Treks & Hill Trails",
      score: trekScore,
      status: trkStat.status,
      badgeColor: trkStat.color,
      tips:
        trekScore >= 75
          ? "Stable atmospheric conditions. Pack trail shoes and adequate hydration."
          : "Slippery rocks or low visibility possible. Stick to marked routes.",
    },
    {
      category: "indoor_heritage",
      label: "Museums & Cultural Sites",
      score: indoorScore,
      status: indStat.status,
      badgeColor: indStat.color,
      tips: "Climate-controlled, all-weather sanctuary. Perfect backup option anytime.",
    },
    {
      category: "photography",
      label: "Golden Hour & Photography",
      score: photoScore,
      status: phtStat.status,
      badgeColor: phtStat.color,
      tips:
        photoScore >= 75
          ? "Crisp horizon visibility. Outstanding lighting around sunrise and sunset."
          : "Overcast skies may diffuse natural ambient sunlight.",
    },
  ];
}

/**
 * Computes plain-language summary weather advisory for travelers
 */
export function computeSummaryAdvisory(
  current: CurrentWeather,
  daily: DailyWeather[],
  locationName: string,
  airQuality?: AirQualityData
): string {
  const primaryCondition = current.condition;
  const temp = Math.round(current.temperature);
  const rainToday = daily[0]?.precipitationProbability ?? current.precipitationProbability;
  const aqiCategory = airQuality?.category || "Good";

  let advice = `${temp}°C with ${primaryCondition.toLowerCase()} in ${locationName}. `;

  if (rainToday > 50) {
    advice += `High chance of precipitation (${rainToday}%). We recommend indoor cultural sites, museums, and cafes during afternoon hours.`;
  } else if (temp > 35) {
    advice += `Peak afternoon heat expected. Hydrate regularly and schedule walking excursions for morning or sunset.`;
  } else if (temp < 15) {
    advice += `Cooler climate. Pack warm layers for evening explorations.`;
  } else {
    advice += `Ideal conditions for outdoor sightseeing, city walking, and photography.`;
  }

  if (airQuality && (aqiCategory === "Sensitive" || aqiCategory === "Unhealthy")) {
    advice += ` Air quality is ${aqiCategory.toLowerCase()} (AQI ${airQuality.aqiUs}). Sensitive travelers should pace outdoor activities.`;
  }

  return advice;
}

/**
 * Standard WMO Weather interpretation code mapping
 */
export function mapWeatherCode(code?: number | null): string {
  if (code === undefined || code === null) return "Clear Sky";
  if (code === 0) return "Clear Sky";
  if (code === 1) return "Mainly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 55) return "Drizzle";
  if (code >= 61 && code <= 65) return "Rainy";
  if (code === 66 || code === 67) return "Freezing Rain";
  if (code >= 71 && code <= 77) return "Snowy";
  if (code >= 80 && code <= 82) return "Rain Showers";
  if (code === 85 || code === 86) return "Snow Showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Variable";
}

export const openMeteoWeatherProvider = new OpenMeteoWeatherProvider();
export const weatherService = openMeteoWeatherProvider;
