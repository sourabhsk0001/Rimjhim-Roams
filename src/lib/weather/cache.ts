import {
  WeatherForecastResponse,
  CurrentWeather,
  HistoricalWeatherResponse,
  WeatherSnapshot,
} from "@/types/weather";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory caches for fast sub-millisecond retrieval
const currentCache = new Map<string, CacheEntry<CurrentWeather>>();
const forecastCache = new Map<string, CacheEntry<WeatherForecastResponse>>();
const historicalCache = new Map<string, CacheEntry<HistoricalWeatherResponse[]>>();
const memorySnapshots = new Map<string, WeatherSnapshot>();

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url && key && !url.includes("mock-project") && key !== "mock-anon-key"
  );
}

function makeGeoKey(lat: number, lon: number, extra: string = ""): string {
  const rLat = Math.round(lat * 100) / 100;
  const rLon = Math.round(lon * 100) / 100;
  return `${rLat}:${rLon}:${extra}`;
}

export class WeatherCacheManager {
  // Current Weather: 30 minutes TTL
  getCurrent(lat: number, lon: number): CurrentWeather | null {
    const key = makeGeoKey(lat, lon, "current");
    const entry = currentCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    currentCache.delete(key);
    return null;
  }

  setCurrent(lat: number, lon: number, data: CurrentWeather, ttlSeconds: number = 1800): void {
    const key = makeGeoKey(lat, lon, "current");
    currentCache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  // Forecast: 2 hours TTL
  getForecast(lat: number, lon: number, days: number): WeatherForecastResponse | null {
    const key = makeGeoKey(lat, lon, `forecast_${days}`);
    const entry = forecastCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return { ...entry.data, isCached: true };
    }
    forecastCache.delete(key);
    return null;
  }

  setForecast(
    lat: number,
    lon: number,
    days: number,
    data: WeatherForecastResponse,
    ttlSeconds: number = 7200
  ): void {
    const key = makeGeoKey(lat, lon, `forecast_${days}`);
    forecastCache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  // Historical: 24 hours TTL
  getHistorical(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string
  ): HistoricalWeatherResponse[] | null {
    const key = makeGeoKey(lat, lon, `hist_${startDate}_${endDate}`);
    const entry = historicalCache.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data;
    }
    historicalCache.delete(key);
    return null;
  }

  setHistorical(
    lat: number,
    lon: number,
    startDate: string,
    endDate: string,
    data: HistoricalWeatherResponse[],
    ttlSeconds: number = 86400
  ): void {
    const key = makeGeoKey(lat, lon, `hist_${startDate}_${endDate}`);
    historicalCache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  // ----------------------------------------------------------------------------
  // Persistent Weather Snapshots
  // ----------------------------------------------------------------------------

  async saveSnapshot(
    tripId: string,
    destinationId: string | undefined,
    latitude: number,
    longitude: number,
    date: string,
    snapshotData: WeatherForecastResponse
  ): Promise<WeatherSnapshot> {
    const snapshotId = `snap_${tripId}_${date}`;
    const now = new Date().toISOString();

    const snapshot: WeatherSnapshot = {
      id: snapshotId,
      trip_id: tripId,
      destination_id: destinationId,
      latitude,
      longitude,
      date,
      snapshot_data: snapshotData,
      created_at: now,
      updated_at: now,
    };

    // 1. In-memory store
    memorySnapshots.set(snapshotId, snapshot);

    // 2. Supabase if configured
    if (isSupabaseLive()) {
      try {
        const supabase = createServerSupabase();
        const client = supabase as unknown as {
          from: (table: string) => {
            upsert: (record: unknown, options: { onConflict: string }) => Promise<unknown>;
          };
        };
        await client.from("weather_snapshots").upsert(
          {
            trip_id: tripId,
            destination_id: destinationId || null,
            latitude,
            longitude,
            date,
            snapshot_data: snapshotData,
            updated_at: now,
          },
          { onConflict: "trip_id,date" }
        );
      } catch {
        // Fall back quietly to in-memory map
      }
    }

    return snapshot;
  }

  async getSnapshotsForTrip(tripId: string): Promise<WeatherSnapshot[]> {
    const inMem = Array.from(memorySnapshots.values()).filter(
      (s) => s.trip_id === tripId
    );

    if (!isSupabaseLive() || inMem.length > 0) {
      return inMem.sort((a, b) => a.date.localeCompare(b.date));
    }

    try {
      const supabase = createServerSupabase();
      const client = supabase as unknown as {
        from: (table: string) => {
          select: (fields: string) => {
            eq: (col: string, val: string) => {
              order: (col: string, opt: { ascending: boolean }) => Promise<{
                data: WeatherSnapshot[] | null;
              }>;
            };
          };
        };
      };

      const { data } = await client
        .from("weather_snapshots")
        .select("*")
        .eq("trip_id", tripId)
        .order("date", { ascending: true });

      if (data && data.length > 0) {
        for (const snap of data) {
          memorySnapshots.set(`snap_${snap.trip_id}_${snap.date}`, snap);
        }
        return data;
      }
    } catch {
      // Fallback
    }

    return inMem;
  }

  clearAll(): void {
    currentCache.clear();
    forecastCache.clear();
    historicalCache.clear();
    memorySnapshots.clear();
  }
}

export const weatherCache = new WeatherCacheManager();
