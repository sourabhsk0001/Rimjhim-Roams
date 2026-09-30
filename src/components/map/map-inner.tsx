"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Car, Footprints, Bike, MapPin, Compass, Building, Utensils } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RouteMode } from "@/lib/geo/routing";

export interface MapMarkerItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: "destination" | "attraction" | "hotel" | "restaurant";
  order?: number;
  isSelected?: boolean;
  details?: {
    category?: string;
    price?: number | string;
    rating?: number;
    cuisine?: string;
    hours?: string;
  };
}

export interface MapInnerProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  routeCoordinates?: [number, number][]; // [longitude, latitude]
  routeDistanceKm?: number;
  routeDurationMinutes?: number;
  routeMode?: RouteMode;
  onModeChange?: (mode: RouteMode) => void;
  onMarkerSelect?: (marker: MapMarkerItem) => void;
  height?: string;
}

// Custom styled div icons to avoid Leaflet asset path 404s
function createCustomIcon(
  type: MapMarkerItem["type"],
  order?: number,
  isSelected?: boolean
) {
  let bgColor = "bg-blue-600";
  let displayChar: string | number = "D";

  if (type === "attraction") {
    bgColor = "bg-emerald-600";
    displayChar = order !== undefined ? order : "★";
  } else if (type === "hotel") {
    bgColor = "bg-amber-600";
    displayChar = order !== undefined ? order : "H";
  } else if (type === "restaurant") {
    bgColor = "bg-rose-600";
    displayChar = order !== undefined ? order : "R";
  } else if (order !== undefined) {
    displayChar = order;
  }

  const size = isSelected ? 34 : 28;
  const half = size / 2;
  const borderWidth = isSelected ? "3px" : "2px";
  const ringStyle = isSelected
    ? "box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.4), 0 4px 12px rgba(0,0,0,0.35); transform: scale(1.15);"
    : "box-shadow: 0 2px 6px rgba(0,0,0,0.3);";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${isSelected ? 13 : 11}px;
      ${ringStyle}
      border: ${borderWidth} solid white;
      transition: all 0.2s ease;
    " class="${bgColor}">${displayChar}</div>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
  });
}

// Controller to auto-center/fit bounds when waypoints change
function MapViewController({
  center,
  zoom,
  routeCoordinates,
}: {
  center: [number, number];
  zoom: number;
  routeCoordinates?: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 1) {
      const latLngs = routeCoordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView(center, zoom);
    }
  }, [map, center, zoom, routeCoordinates]);

  return null;
}

export default function MapInner({
  center,
  zoom = 12,
  markers = [],
  routeCoordinates = [],
  routeDistanceKm,
  routeDurationMinutes,
  routeMode = "driving",
  onModeChange,
  onMarkerSelect,
  height = "420px",
}: MapInnerProps) {
  const [filterType, setFilterType] = useState<string>("all");

  const filteredMarkers =
    filterType === "all"
      ? markers
      : markers.filter((m) => m.type === filterType || m.type === "destination");

  // Invert [lng, lat] GeoJSON coordinates to [lat, lng] for Leaflet Polyline
  const polylinePositions = routeCoordinates.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  );

  return (
    <div className="relative rounded-xl overflow-hidden border shadow-sm bg-card flex flex-col">
      {/* Top Map Controls Overlay */}
      <div className="p-3 bg-card/95 backdrop-blur border-b flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        {/* Layer Filters */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-muted-foreground mr-1">Layer:</span>
          {[
            { id: "all", label: "All Sights" },
            { id: "attraction", label: "Attractions", icon: Compass },
            { id: "hotel", label: "Hotels", icon: Building },
            { id: "restaurant", label: "Dining", icon: Utensils },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                filterType === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Route Stats & Mode Selector */}
        {onModeChange && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground">Mode:</span>
            <div className="flex rounded-md border bg-muted/50 p-0.5">
              {[
                { id: "driving", label: "Drive", icon: Car },
                { id: "walking", label: "Walk", icon: Footprints },
                { id: "cycling", label: "Cycle", icon: Bike },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = routeMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => onModeChange(m.id as RouteMode)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                      isSelected
                        ? "bg-card text-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Leaflet Map Canvas */}
      <div style={{ height, width: "100%" }} className="relative z-0">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          {/* Free OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewController
            center={center}
            zoom={zoom}
            routeCoordinates={routeCoordinates}
          />

          {/* Markers */}
          {filteredMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={[marker.latitude, marker.longitude]}
              icon={createCustomIcon(marker.type, marker.order, marker.isSelected)}
              eventHandlers={{
                click: () => onMarkerSelect?.(marker),
              }}
            >
              <Popup>
                <div className="p-1 max-w-[200px] space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-sm leading-tight">
                      {marker.name}
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {marker.type}
                    </Badge>
                  </div>

                  {marker.details?.category && (
                    <p className="text-muted-foreground">{marker.details.category}</p>
                  )}

                  {marker.details?.cuisine && (
                    <p className="text-muted-foreground font-medium">
                      Cuisine: {marker.details.cuisine}
                    </p>
                  )}

                  {marker.details?.price !== undefined && (
                    <p className="font-semibold text-emerald-600">
                      Rate: ₹{marker.details.price}
                    </p>
                  )}

                  {marker.details?.rating && (
                    <p className="text-amber-500 font-semibold">
                      ★ {marker.details.rating} / 5.0
                    </p>
                  )}

                  {marker.details?.hours && (
                    <p className="text-muted-foreground text-[10px]">
                      Hours: {marker.details.hours}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* OSRM Route Polyline */}
          {polylinePositions.length > 0 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: "#2563eb",
                weight: 4,
                opacity: 0.85,
                lineJoin: "round",
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Bottom Route Information Bar */}
      {routeDistanceKm !== undefined && routeDistanceKm > 0 && (
        <div className="p-2.5 bg-card/90 backdrop-blur border-t flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Route Distance:{" "}
              <strong className="text-foreground">{routeDistanceKm} km</strong>
            </span>

            {routeDurationMinutes !== undefined && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                Est. Duration:{" "}
                <strong className="text-foreground">
                  {routeDurationMinutes < 60
                    ? `${routeDurationMinutes} mins`
                    : `${Math.floor(routeDurationMinutes / 60)}h ${
                        routeDurationMinutes % 60
                      }m`}
                </strong>
              </span>
            )}
          </div>

          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            OSRM + OpenStreetMap
          </Badge>
        </div>
      )}
    </div>
  );
}
