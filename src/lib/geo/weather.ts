import { WeatherForecast } from "@/types/travel";

/**
 * Fetches free weather forecasts from Open-Meteo API without requiring an API key.
 */
export async function getDestinationWeather(
  latitude: number,
  longitude: number,
  locationName: string = "Destination"
): Promise<WeatherForecast> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const daily = data.daily || {};

    const dailyForecast = (daily.time || []).map((date: string, i: number) => ({
      date,
      tempMin: daily.temperature_2m_min?.[i] ?? 0,
      tempMax: daily.temperature_2m_max?.[i] ?? 0,
      condition: mapWeatherCode(daily.weather_code?.[i]),
    }));

    return {
      location: locationName,
      currentTemp: current.temperature_2m ?? 20,
      unit: "°C",
      condition: mapWeatherCode(current.weather_code),
      precipitationProbability: daily.precipitation_probability_max?.[0] ?? 0,
      dailyForecast,
    };
  } catch (error) {
    console.error("Failed to fetch weather from Open-Meteo:", error);
    return {
      location: locationName,
      currentTemp: 22,
      unit: "°C",
      condition: "Clear",
      precipitationProbability: 10,
      dailyForecast: [],
    };
  }
}

function mapWeatherCode(code?: number): string {
  if (code === undefined || code === null) return "Clear";
  if (code === 0) return "Clear Sky";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 99) return "Thunderstorm";
  return "Variable";
}
