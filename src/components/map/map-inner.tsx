"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Car,
  Footprints,
  Bike,
  MapPin,
  Compass,
  Building,
  Utensils,
  Layers,
  Box,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Plane,
  Train,
  Play,
  Pause,
  Clock,
  Coins,
  Star,
  Navigation as NavIcon,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RouteMode } from "@/lib/geo/routing";

export type MapMarkerType =
  | "destination"
  | "attraction"
  | "hotel"
  | "restaurant"
  | "taxi"
  | "airport"
  | "railway"
  | "current_location";

export interface MapMarkerItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: MapMarkerType;
  order?: number;
  isSelected?: boolean;
  code?: string; // IATA (e.g. DEL) or Station Code (e.g. NDLS)
  details?: {
    category?: string;
    price?: number | string;
    rating?: number;
    reviewsCount?: number;
    cuisine?: string;
    hours?: string;
    durationMinutes?: number;
    estimatedCost?: number | string;
    vehicleType?: string;
    description?: string;
    distanceKm?: number;
    facilities?: string[];
  };
}

export interface ItineraryDayOption {
  dayNumber: number;
  label?: string;
  theme?: string;
  coordinates?: [number, number][];
  distanceKm?: number;
  durationMinutes?: number;
  transportCostInr?: number;
}

export interface MapInnerProps {
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
  markers?: MapMarkerItem[];
  routeCoordinates?: [number, number][]; // [longitude, latitude] GeoJSON
  routeDistanceKm?: number;
  routeDurationMinutes?: number;
  routeTransportCostInr?: number;
  routeMode?: RouteMode;
  onModeChange?: (mode: RouteMode) => void;
  onMarkerSelect?: (marker: MapMarkerItem) => void;
  height?: string;
  // Day-by-day itinerary route switching
  days?: ItineraryDayOption[];
  selectedDayNumber?: number;
  onDaySelect?: (dayNumber: number) => void;
  // Current trip location indicator
  currentLocation?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  // Emergency "I'm Lost" trigger
  onLostModeClick?: () => void;
  // Emergency Mode trigger
  onEmergencyModeClick?: () => void;
}

export type MapStyleKey = "voyager" | "standard" | "positron" | "dark" | "topo";

const OSM_STYLES: Record<
  MapStyleKey,
  { label: string; icon: string; tileUrl: string; attribution: string }
> = {
  voyager: {
    label: "OSM Voyager",
    icon: "🧭",
    tileUrl: "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
  },
  standard: {
    label: "OSM Classic",
    icon: "🗺️",
    tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  },
  positron: {
    label: "OSM Light",
    icon: "☀️",
    tileUrl: "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
  },
  dark: {
    label: "OSM Night",
    icon: "🌙",
    tileUrl: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
  },
  topo: {
    label: "OSM Topo (3D Relief)",
    icon: "⛰️",
    tileUrl: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> | <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a>',
  },
};

function buildMapStyleSpec(styleKey: MapStyleKey): maplibregl.StyleSpecification {
  const cfg = OSM_STYLES[styleKey];
  return {
    version: 8,
    sources: {
      "osm-base-tiles": {
        type: "raster",
        tiles: [cfg.tileUrl],
        tileSize: 256,
        attribution: cfg.attribution,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "osm-base-layer",
        type: "raster",
        source: "osm-base-tiles",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

export default function MapInner({
  center,
  zoom = 12,
  markers = [],
  routeCoordinates = [],
  routeDistanceKm,
  routeDurationMinutes,
  routeTransportCostInr,
  routeMode = "driving",
  onModeChange,
  onMarkerSelect,
  height = "480px",
  days = [],
  selectedDayNumber,
  onDaySelect,
  currentLocation,
  onLostModeClick,
  onEmergencyModeClick,
}: MapInnerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const tourIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [activeStyle, setActiveStyle] = useState<MapStyleKey>("voyager");
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [is3D, setIs3D] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [tourStopIndex, setTourStopIndex] = useState(0);

  // Compute estimated transport cost dynamically if not provided
  const estimatedCost = useMemo(() => {
    if (routeTransportCostInr !== undefined && routeTransportCostInr > 0) {
      return routeTransportCostInr;
    }
    if (routeDistanceKm && routeDistanceKm > 0) {
      if (routeMode === "driving") {
        return Math.max(70, Math.round(50 + routeDistanceKm * 18));
      }
      if (routeMode === "cycling" || routeMode === "walking") {
        return 0;
      }
    }
    return 150;
  }, [routeTransportCostInr, routeDistanceKm, routeMode]);

  // Combine markers with current location if provided
  const allMarkers = useMemo(() => {
    const list = [...markers];
    if (currentLocation) {
      list.unshift({
        id: "current-user-location",
        name: currentLocation.name || "Your Current Location",
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        type: "current_location",
        details: {
          category: "Live GPS Waypoint",
          description: "Active traveler position in itinerary route.",
        },
      });
    }
    return list;
  }, [markers, currentLocation]);

  // Filter markers based on selected layer
  const filteredMarkers = useMemo(() => {
    if (filterType === "all") return allMarkers;
    if (filterType === "transit") {
      return allMarkers.filter(
        (m) =>
          m.type === "taxi" ||
          m.type === "airport" ||
          m.type === "railway" ||
          m.type === "destination"
      );
    }
    return allMarkers.filter(
      (m) =>
        m.type === filterType ||
        m.type === "destination" ||
        m.type === "current_location"
    );
  }, [allMarkers, filterType]);

  // Safe route update helper for MapLibre WebGL lines with animated dash casing
  const updateRouteOnMap = useCallback(
    (map: maplibregl.Map, coords: [number, number][]) => {
      const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      };

      const source = map.getSource("route-source") as
        | maplibregl.GeoJSONSource
        | undefined;

      if (source) {
        source.setData(geojson);
      } else {
        map.addSource("route-source", {
          type: "geojson",
          data: geojson,
        });

        // 1. Outer ambient glow layer
        map.addLayer({
          id: "route-casing",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 10,
            "line-opacity": 0.35,
          },
        });

        // 2. High-contrast route line
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#2563eb",
            "line-width": 4.5,
            "line-opacity": 0.95,
          },
        });

        // 3. Glowing neon core beam
        map.addLayer({
          id: "route-core",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#93c5fd",
            "line-width": 2,
            "line-opacity": 0.9,
          },
        });
      }
    },
    []
  );

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Convert center from [lat, lng] to [lng, lat] for MapLibre
    const mapLngLat: [number, number] = [center[1], center[0]];

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyleSpec(activeStyle),
      center: mapLngLat,
      zoom: zoom,
      pitch: 0,
      bearing: 0,
      dragRotate: true,
      pitchWithRotate: true,
      maxPitch: 65,
      attributionControl: {
        compact: true,
      },
    });

    // Add navigation controls (zoom + compass + pitch visualizer)
    const navControl = new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: true,
    });
    map.addControl(navControl, "top-right");

    map.on("load", () => {
      mapRef.current = map;
      if (routeCoordinates && routeCoordinates.length > 1) {
        updateRouteOnMap(map, routeCoordinates);
      }
    });

    return () => {
      if (tourIntervalRef.current) {
        clearInterval(tourIntervalRef.current);
      }
      activeMarkersRef.current.forEach((m) => m.remove());
      activeMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Map Style (OSM Theme) changes
  const handleStyleChange = (styleKey: MapStyleKey) => {
    setActiveStyle(styleKey);
    setShowStyleMenu(false);
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(buildMapStyleSpec(styleKey));
    map.once("style.load", () => {
      if (routeCoordinates && routeCoordinates.length > 1) {
        updateRouteOnMap(map, routeCoordinates);
      }
      if (is3D) {
        map.easeTo({ pitch: 56, bearing: -18, duration: 600 });
      }
    });
  };

  // Sync route coordinates on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (routeCoordinates && routeCoordinates.length > 1) {
      updateRouteOnMap(map, routeCoordinates);
    } else {
      const source = map.getSource("route-source") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (source) {
        source.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] },
        });
      }
    }
  }, [routeCoordinates, updateRouteOnMap]);

  // Sync Markers on Map with Distinct Icons and Badges
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    activeMarkersRef.current.forEach((m) => m.remove());
    activeMarkersRef.current = [];

    filteredMarkers.forEach((marker) => {
      const el = document.createElement("div");
      el.className = "group cursor-pointer select-none";

      let bgClass = "bg-blue-600";
      let borderClass = "border-white";
      let iconOrText = "★";
      let badgeLabel = marker.type.toUpperCase();

      switch (marker.type) {
        case "hotel":
          bgClass = "bg-amber-500 shadow-amber-500/30";
          borderClass = "border-amber-100";
          iconOrText = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;
          badgeLabel = "HOTEL";
          break;
        case "attraction":
          bgClass = "bg-emerald-600 shadow-emerald-600/30";
          borderClass = "border-emerald-100";
          iconOrText =
            marker.order !== undefined
              ? `<span class="font-extrabold text-[12px]">#${marker.order}</span>`
              : `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
          badgeLabel = marker.order ? `STOP #${marker.order}` : "ATTRACTION";
          break;
        case "restaurant":
          bgClass = "bg-rose-500 shadow-rose-500/30";
          borderClass = "border-rose-100";
          iconOrText = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2"/><path d="M15 11v11"/><path d="M5 2v4a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2"/><path d="M8 9v13"/></svg>`;
          badgeLabel = "DINING";
          break;
        case "taxi":
          bgClass = "bg-amber-400 text-slate-900 shadow-amber-400/40";
          borderClass = "border-slate-900";
          iconOrText = `<svg class="w-3.5 h-3.5 text-slate-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
          badgeLabel = "TAXI PICKUP";
          break;
        case "airport":
          bgClass = "bg-sky-600 shadow-sky-600/30";
          borderClass = "border-sky-100";
          iconOrText = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>`;
          badgeLabel = marker.code ? `AIRPORT (${marker.code})` : "AIRPORT";
          break;
        case "railway":
          bgClass = "bg-indigo-600 shadow-indigo-600/30";
          borderClass = "border-indigo-100";
          iconOrText = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>`;
          badgeLabel = marker.code ? `STATION (${marker.code})` : "RAILWAY";
          break;
        case "current_location":
          bgClass = "bg-violet-600 shadow-violet-600/40";
          borderClass = "border-white";
          iconOrText = `<svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`;
          badgeLabel = "CURRENT LOCATION";
          break;
        case "destination":
        default:
          bgClass = "bg-blue-600 shadow-blue-600/30";
          borderClass = "border-blue-100";
          iconOrText = `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
          badgeLabel = "CITY CENTER";
          break;
      }

      const isSelected = marker.isSelected;
      const size = isSelected ? "w-9 h-9 text-xs" : "w-7 h-7 text-[11px]";
      const ring = isSelected
        ? "ring-4 ring-blue-500/60 shadow-xl scale-110"
        : "shadow-md hover:scale-110";

      // Render radar ping rings for Current Location or Selected Stop
      const isRadarPulse = marker.type === "current_location" || isSelected;

      el.innerHTML = `
        <div class="relative flex items-center justify-center transition-transform duration-200">
          <div class="${size} rounded-full ${bgClass} ${ring} text-white font-bold flex items-center justify-center border-2 ${borderClass}">
            ${iconOrText}
          </div>
          ${
            isRadarPulse
              ? `<div class="absolute -inset-2 rounded-full ${
                  marker.type === "current_location" ? "bg-violet-500/30" : "bg-blue-500/30"
                } animate-ping pointer-events-none"></div>`
              : ""
          }
          ${
            marker.type === "current_location"
              ? `<div class="absolute -inset-3.5 rounded-full bg-violet-400/20 animate-pulse pointer-events-none"></div>`
              : ""
          }
        </div>
      `;

      // Build rich MapLibre Popup with Star Rating, Cost, Duration, and Badges
      const starsHtml =
        marker.details?.rating !== undefined
          ? `<div class="flex items-center gap-1 text-amber-500 font-bold text-xs">
              <span>★</span>
              <span>${marker.details.rating}</span>
              <span class="text-slate-400 font-normal text-[10px]">/ 5.0</span>
              ${
                marker.details.reviewsCount
                  ? `<span class="text-slate-400 font-normal text-[10px]">(${marker.details.reviewsCount.toLocaleString()})</span>`
                  : ""
              }
            </div>`
          : "";

      const popupHtml = `
        <div class="space-y-2 font-sans min-w-[210px] max-w-[270px]">
          <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100">
            <span class="font-bold text-slate-900 text-xs tracking-tight line-clamp-1">
              ${marker.name}
            </span>
            <span class="text-[9px] font-semibold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
              ${badgeLabel}
            </span>
          </div>

          ${
            marker.details?.category
              ? `<p class="text-[11px] text-slate-600 font-medium">${marker.details.category}</p>`
              : ""
          }

          ${
            marker.details?.description
              ? `<p class="text-[11px] text-slate-500 line-clamp-2">${marker.details.description}</p>`
              : ""
          }

          <div class="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-50 text-[11px]">
            ${
              marker.details?.price !== undefined
                ? `<div class="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span>💰</span>
                    <span>${
                      typeof marker.details.price === "number"
                        ? `₹${marker.details.price}`
                        : marker.details.price
                    }</span>
                  </div>`
                : ""
            }

            ${
              marker.details?.estimatedCost !== undefined
                ? `<div class="flex items-center gap-1 text-emerald-700 font-medium">
                    <span>🚕</span>
                    <span>₹${marker.details.estimatedCost} fare</span>
                  </div>`
                : ""
            }

            ${
              marker.details?.durationMinutes !== undefined
                ? `<div class="flex items-center gap-1 text-slate-600">
                    <span>⏱️</span>
                    <span>${marker.details.durationMinutes} mins</span>
                  </div>`
                : ""
            }

            ${
              marker.details?.cuisine
                ? `<div class="col-span-2 text-slate-700 font-medium">
                    🍽️ ${marker.details.cuisine}
                  </div>`
                : ""
            }

            ${
              marker.details?.hours
                ? `<div class="col-span-2 text-slate-500 text-[10px]">
                    ⏱️ Open: ${marker.details.hours}
                  </div>`
                : ""
            }

            ${
              marker.details?.vehicleType
                ? `<div class="col-span-2 text-amber-800 bg-amber-50 rounded px-1.5 py-0.5 text-[10px] font-medium">
                    🚖 ${marker.details.vehicleType}
                  </div>`
                : ""
            }
          </div>

          ${starsHtml ? `<div class="pt-1 flex items-center justify-between border-t border-slate-50">${starsHtml}</div>` : ""}

          ${
            marker.type === "attraction"
              ? `<div class="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span class="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                    🛡️ Signals: 🟢 🟡
                  </span>
                  <span class="text-slate-500 font-medium">9 AM–6 PM Opt.</span>
                </div>`
              : ""
          }

          ${
            marker.details?.facilities && marker.details.facilities.length > 0
              ? `<div class="flex flex-wrap gap-1 pt-1">
                  ${marker.details.facilities
                    .slice(0, 3)
                    .map(
                      (f) =>
                        `<span class="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">${f}</span>`
                    )
                    .join("")}
                </div>`
              : ""
          }
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: true,
        closeOnClick: true,
        maxWidth: "280px",
      }).setHTML(popupHtml);

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([marker.longitude, marker.latitude])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        onMarkerSelect?.(marker);
      });

      activeMarkersRef.current.push(m);
    });
  }, [filteredMarkers, onMarkerSelect]);

  // Fit camera bounds when route or markers change
  const handleFitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = new maplibregl.LngLatBounds();

    if (routeCoordinates && routeCoordinates.length > 1) {
      routeCoordinates.forEach(([lng, lat]) => bounds.extend([lng, lat]));
    } else if (filteredMarkers.length > 0) {
      filteredMarkers.forEach((m) => bounds.extend([m.longitude, m.latitude]));
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 70, bottom: 70, left: 70, right: 70 },
        maxZoom: 15,
        duration: 900,
      });
    } else {
      map.flyTo({
        center: [center[1], center[0]],
        zoom,
        duration: 800,
      });
    }
  }, [center, filteredMarkers, routeCoordinates, zoom]);

  // Auto-fit on initial route load
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routeCoordinates && routeCoordinates.length > 1) {
      handleFitBounds();
    }
  }, [routeCoordinates, handleFitBounds]);

  // 3D Perspective Tilt and Terrain Relief Toggle
  const toggle3D = () => {
    const map = mapRef.current;
    if (!map) return;

    if (is3D) {
      map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      setIs3D(false);
    } else {
      map.easeTo({
        pitch: 58,
        bearing: -18,
        zoom: Math.max(map.getZoom(), 12.5),
        duration: 900,
      });
      setIs3D(true);
    }
  };

  // 3D Cinematic Tour Fly-Through
  const toggleCinematicTour = () => {
    const map = mapRef.current;
    if (!map) return;

    if (isTourPlaying) {
      if (tourIntervalRef.current) clearInterval(tourIntervalRef.current);
      setIsTourPlaying(false);
      return;
    }

    const stops = filteredMarkers.filter((m) => m.type !== "destination");
    if (stops.length === 0) return;

    setIsTourPlaying(true);
    let idx = tourStopIndex % stops.length;

    const flyToStop = (stop: MapMarkerItem, index: number) => {
      map.flyTo({
        center: [stop.longitude, stop.latitude],
        zoom: 15.2,
        pitch: 56,
        bearing: (index * 45) % 360,
        speed: 0.8,
        curve: 1.4,
        essential: true,
      });
      setTourStopIndex(index);
    };

    flyToStop(stops[idx], idx);

    tourIntervalRef.current = setInterval(() => {
      idx = (idx + 1) % stops.length;
      flyToStop(stops[idx], idx);
    }, 4500);
  };

  // Fullscreen expansion toggle
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      mapRef.current?.resize();
    }, 150);
  };

  // Center on Current Location Waypoint
  const focusCurrentLocation = () => {
    const map = mapRef.current;
    if (!map || !currentLocation) return;

    map.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 15,
      pitch: 45,
      duration: 1000,
    });
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm bg-card flex flex-col transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl h-[calc(100vh-2rem)]" : ""
      }`}
      style={{ height: isFullscreen ? "calc(100vh - 2rem)" : height }}
    >
      {/* 1. Top Control Deck: Filter Layers, Mode Switcher & Map Tools */}
      <div className="p-2.5 sm:p-3 bg-white/95 backdrop-blur-md border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs z-10">
        {/* Layer Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Layers:
          </span>
          {[
            { id: "all", label: "All Sights" },
            { id: "attraction", label: "Attractions", icon: Compass },
            { id: "hotel", label: "Hotels", icon: Building },
            { id: "restaurant", label: "Dining", icon: Utensils },
            { id: "transit", label: "Transit Hubs", icon: Train },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-2.5 py-1 rounded-full transition-all text-[11px] font-medium flex items-center gap-1 ${
                filterType === item.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Travel Mode Selector & Tools Deck */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {/* Route Mode Switcher */}
          {onModeChange && (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-400 hidden sm:inline">Mode:</span>
              <div className="flex rounded-full border border-slate-200 bg-slate-50 p-0.5 shadow-2xs">
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
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all ${
                        isSelected
                          ? "bg-white text-slate-900 font-semibold shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                      title={m.label}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="hidden md:inline">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map Style (OSM Theme) Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStyleMenu((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-medium shadow-2xs transition-colors"
              title="Change OpenStreetMap Style"
            >
              <Layers className="w-3 h-3 text-blue-600" />
              <span>{OSM_STYLES[activeStyle].label}</span>
            </button>

            {showStyleMenu && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 bg-white shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  OSM Cartography
                </div>
                {(Object.keys(OSM_STYLES) as MapStyleKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleStyleChange(key)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                      activeStyle === key
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{OSM_STYLES[key].icon}</span>
                      <span>{OSM_STYLES[key].label}</span>
                    </span>
                    {activeStyle === key && <span className="text-blue-600">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3D Perspective Tilt Button */}
          <button
            type="button"
            onClick={toggle3D}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
              is3D
                ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title="Toggle 3D Terrain Perspective"
          >
            <Box className="w-3 h-3" />
            <span>3D Relief</span>
          </button>

          {/* 3D Cinematic Tour Fly-Through */}
          <button
            type="button"
            onClick={toggleCinematicTour}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
              isTourPlaying
                ? "bg-purple-600 border-purple-600 text-white shadow-xs animate-pulse"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            title="Fly Along Itinerary Stops"
          >
            {isTourPlaying ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Stop Tour</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                <span>3D Tour</span>
              </>
            )}
          </button>

          {/* I'm Lost SOS Quick Trigger */}
          {onLostModeClick && (
            <button
              type="button"
              onClick={onLostModeClick}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold shadow-xs transition-all hover:scale-[1.03] active:scale-[0.98]"
              title="I'm Lost / What Now? Rescue Wayfinder"
            >
              <AlertTriangle className="w-3 h-3 text-white animate-pulse" />
              <span>🆘 Lost?</span>
            </button>
          )}

          {/* Emergency Mode Quick Trigger */}
          {onEmergencyModeClick && (
            <button
              type="button"
              onClick={onEmergencyModeClick}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold shadow-xs transition-all hover:scale-[1.03] active:scale-[0.98]"
              title="🚨 Emergency Mode (Hospitals, Police, Pharmacies, Embassies)"
            >
              <AlertOctagon className="w-3 h-3 text-white animate-pulse" />
              <span>🚨 Emergency</span>
            </button>
          )}

          {/* Focus Current Location Button */}
          {currentLocation && (
            <button
              type="button"
              onClick={focusCurrentLocation}
              className="p-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
              title="Focus Your Current Location"
            >
              <NavIcon className="w-3 h-3" />
            </button>
          )}

          {/* Re-center / Fit Bounds Button */}
          <button
            type="button"
            onClick={handleFitBounds}
            className="p-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Fit All Stops & Route"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Fullscreen Expand Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Floating Day-by-Day Route Selector Ribbon (If itinerary days provided) */}
      {days.length > 0 && (
        <div className="absolute top-14 left-3 right-3 sm:right-auto z-10 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md overflow-x-auto max-w-full">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-1 tracking-wider">
            Day:
          </span>
          {days.map((d) => {
            const isSelected = selectedDayNumber === d.dayNumber;
            return (
              <button
                key={d.dayNumber}
                type="button"
                onClick={() => onDaySelect?.(d.dayNumber)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-xs scale-[1.02]"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
                }`}
              >
                Day {d.dayNumber}
                {d.theme ? ` (${d.theme.substring(0, 10)})` : ""}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. MapLibre GL WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full bg-slate-100"
        style={{ minHeight: "260px" }}
      />

      {/* 4. Bottom Route Telemetry HUD: Distance, Travel Time, Transportation Cost, & Transit Badges */}
      <div className="p-2.5 sm:p-3 bg-white/95 backdrop-blur-md border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          {/* Distance */}
          {routeDistanceKm !== undefined && routeDistanceKm > 0 ? (
            <span className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Route:{" "}
              <strong className="text-slate-900 font-semibold">
                {routeDistanceKm} km
              </strong>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Multi-stop route</span>
            </span>
          )}

          {/* Estimated Travel Time */}
          {routeDurationMinutes !== undefined && routeDurationMinutes > 0 && (
            <span className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              Travel Time:{" "}
              <strong className="text-slate-900 font-semibold">
                {routeDurationMinutes < 60
                  ? `${routeDurationMinutes} mins`
                  : `${Math.floor(routeDurationMinutes / 60)}h ${
                      routeDurationMinutes % 60
                    }m`}
              </strong>
            </span>
          )}

          {/* Estimated Transportation Cost */}
          <span className="flex items-center gap-1.5 text-slate-600">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            Est. Transport:{" "}
            <strong className="text-emerald-700 font-bold">
              {routeMode === "walking" || routeMode === "cycling"
                ? "₹0 (Pedestrian)"
                : `₹${estimatedCost}`}
            </strong>
          </span>

          {/* Transit Hub Indicators */}
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Plane className="w-3 h-3 text-sky-500" /> Airport
            </span>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Train className="w-3 h-3 text-indigo-500" /> Railway
            </span>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Car className="w-3 h-3 text-amber-500" /> Taxi Stands
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Badge
            variant="outline"
            className="text-[10px] text-slate-600 font-mono border-slate-200 bg-slate-50"
          >
            MapLibre GL JS • 3D OSM Engine
          </Badge>
        </div>
      </div>
    </div>
  );
}
