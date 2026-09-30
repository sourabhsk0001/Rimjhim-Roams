import { RouteGeometry } from "@/types/travel";

/**
 * Calculates road routing between waypoints using the free public OSRM service.
 */
export async function getRoute(
  waypoints: Array<{ latitude: number; longitude: number }>
): Promise<RouteGeometry | null> {
  if (waypoints.length < 2) {
    return null;
  }

  // OSRM expects coordinates in {longitude},{latitude}; format
  const coordString = waypoints
    .map((wp) => `${wp.longitude},${wp.latitude}`)
    .join(";");

  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      throw new Error(`OSRM routing failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    return {
      coordinates: route.geometry.coordinates, // array of [lng, lat]
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch (error) {
    console.error("Failed to query OSRM router:", error);
    return null;
  }
}
