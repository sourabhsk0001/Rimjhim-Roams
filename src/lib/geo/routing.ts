export type RouteMode = "driving" | "walking" | "cycling";

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RouteResult {
  success: boolean;
  mode: RouteMode;
  coordinates: [number, number][]; // [longitude, latitude] pairs for Leaflet GeoJSON
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  source: "osrm" | "haversine-fallback";
  error?: string;
}

export interface RoutingProvider {
  calculateRoute(
    waypoints: GeoCoordinate[],
    mode?: RouteMode,
    options?: { timeoutMs?: number }
  ): Promise<RouteResult>;

  calculateDistance(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
    mode?: RouteMode
  ): Promise<{ distanceMeters: number; distanceKm: number }>;

  calculateTravelTime(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
    mode?: RouteMode
  ): Promise<{ durationSeconds: number; durationMinutes: number }>;
}

// Average estimated speeds in meters per second for realistic travel fallback times
const ESTIMATED_SPEEDS_MPS: Record<RouteMode, number> = {
  driving: 13.89, // ~50 km/h
  cycling: 4.17,  // ~15 km/h
  walking: 1.25,  // ~4.5 km/h
};

/**
 * Validates a single geographic coordinate.
 */
export function isValidCoordinate(coord: unknown): coord is GeoCoordinate {
  if (!coord || typeof coord !== "object") return false;
  const { latitude, longitude } = coord as Record<string, unknown>;

  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Calculates great-circle distance between two points using the Haversine formula.
 */
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Production OSRM Routing Provider with timeout, retry, and Haversine fallback.
 */
export class OSMRoutingProvider implements RoutingProvider {
  private baseUrl: string;

  constructor(baseUrl: string = "https://router.project-osrm.org") {
    this.baseUrl = baseUrl;
  }

  async calculateRoute(
    waypoints: GeoCoordinate[],
    mode: RouteMode = "driving",
    options: { timeoutMs?: number } = {}
  ): Promise<RouteResult> {
    const timeoutMs = options.timeoutMs ?? 6000;

    // 1. Validate waypoint quantity
    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      return {
        success: false,
        mode,
        coordinates: [],
        distanceMeters: 0,
        distanceKm: 0,
        durationSeconds: 0,
        durationMinutes: 0,
        source: "haversine-fallback",
        error: "At least 2 valid waypoints are required to calculate a route.",
      };
    }

    // 2. Validate coordinate bounds
    for (let i = 0; i < waypoints.length; i++) {
      if (!isValidCoordinate(waypoints[i])) {
        return {
          success: false,
          mode,
          coordinates: [],
          distanceMeters: 0,
          distanceKm: 0,
          durationSeconds: 0,
          durationMinutes: 0,
          source: "haversine-fallback",
          error: `Invalid coordinates at waypoint index ${i}: [${waypoints[i]?.latitude}, ${waypoints[i]?.longitude}].`,
        };
      }
    }

    // Prepare coordinate query string {lng},{lat};...
    const coordString = waypoints
      .map((wp) => `${wp.longitude},${wp.latitude}`)
      .join(";");

    // Public OSRM routing profile (driving, or fall back for walking/cycling)
    const profile = mode === "walking" || mode === "cycling" ? "driving" : "driving";
    const url = `${this.baseUrl}/route/v1/${profile}/${coordString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OSRM HTTP error status ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || `OSRM routing code: ${data.code}`);
      }

      const primaryRoute = data.routes[0];
      const baseDistanceMeters = Math.round(primaryRoute.distance);

      // Adjust duration based on chosen travel mode
      let calculatedSeconds = Math.round(primaryRoute.duration);
      if (mode === "walking" || mode === "cycling") {
        const speed = ESTIMATED_SPEEDS_MPS[mode];
        calculatedSeconds = Math.round(baseDistanceMeters / speed);
      }

      return {
        success: true,
        mode,
        coordinates: primaryRoute.geometry.coordinates as [number, number][],
        distanceMeters: baseDistanceMeters,
        distanceKm: Math.round((baseDistanceMeters / 1000) * 10) / 10,
        durationSeconds: calculatedSeconds,
        durationMinutes: Math.round(calculatedSeconds / 60),
        source: "osrm",
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // Fallback: Haversine straight-line waypoint path with estimated duration
      let totalMeters = 0;
      const fallbackCoordinates: [number, number][] = [];

      for (let i = 0; i < waypoints.length; i++) {
        fallbackCoordinates.push([waypoints[i].longitude, waypoints[i].latitude]);
        if (i > 0) {
          totalMeters += haversineDistanceMeters(
            waypoints[i - 1].latitude,
            waypoints[i - 1].longitude,
            waypoints[i].latitude,
            waypoints[i].longitude
          );
        }
      }

      const speed = ESTIMATED_SPEEDS_MPS[mode];
      const fallbackSeconds = Math.round(totalMeters / speed);

      const errorMessage =
        err instanceof Error && err.name === "AbortError"
          ? "Routing request timed out. Displaying estimated path."
          : err instanceof Error
          ? err.message
          : "Routing service temporarily unavailable.";

      return {
        success: true, // Graceful degradation preserves map usability
        mode,
        coordinates: fallbackCoordinates,
        distanceMeters: totalMeters,
        distanceKm: Math.round((totalMeters / 1000) * 10) / 10,
        durationSeconds: fallbackSeconds,
        durationMinutes: Math.round(fallbackSeconds / 60),
        source: "haversine-fallback",
        error: errorMessage,
      };
    }
  }

  async calculateDistance(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
    mode: RouteMode = "driving"
  ): Promise<{ distanceMeters: number; distanceKm: number }> {
    const route = await this.calculateRoute([origin, destination], mode);
    return {
      distanceMeters: route.distanceMeters,
      distanceKm: route.distanceKm,
    };
  }

  async calculateTravelTime(
    origin: GeoCoordinate,
    destination: GeoCoordinate,
    mode: RouteMode = "driving"
  ): Promise<{ durationSeconds: number; durationMinutes: number }> {
    const route = await this.calculateRoute([origin, destination], mode);
    return {
      durationSeconds: route.durationSeconds,
      durationMinutes: route.durationMinutes,
    };
  }
}

// Default singleton instance
export const routingProvider = new OSMRoutingProvider();

// Standalone convenience exports
export async function calculateRoute(
  waypoints: GeoCoordinate[],
  mode: RouteMode = "driving",
  options?: { timeoutMs?: number }
): Promise<RouteResult> {
  return routingProvider.calculateRoute(waypoints, mode, options);
}

export async function calculateDistance(
  origin: GeoCoordinate,
  destination: GeoCoordinate,
  mode: RouteMode = "driving"
): Promise<{ distanceMeters: number; distanceKm: number }> {
  return routingProvider.calculateDistance(origin, destination, mode);
}

export async function calculateTravelTime(
  origin: GeoCoordinate,
  destination: GeoCoordinate,
  mode: RouteMode = "driving"
): Promise<{ durationSeconds: number; durationMinutes: number }> {
  return routingProvider.calculateTravelTime(origin, destination, mode);
}
