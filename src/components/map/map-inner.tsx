"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
} from "lucide-react";
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
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
  markers?: MapMarkerItem[];
  routeCoordinates?: [number, number][]; // [longitude, latitude] GeoJSON
  routeDistanceKm?: number;
  routeDurationMinutes?: number;
  routeMode?: RouteMode;
  onModeChange?: (mode: RouteMode) => void;
  onMarkerSelect?: (marker: MapMarkerItem) => void;
  height?: string;
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
    label: "OSM Topo",
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
  routeMode = "driving",
  onModeChange,
  onMarkerSelect,
  height = "460px",
}: MapInnerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [activeStyle, setActiveStyle] = useState<MapStyleKey>("voyager");
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [is3D, setIs3D] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filter markers according to user's layer filter
  const filteredMarkers =
    filterType === "all"
      ? markers
      : markers.filter((m) => m.type === filterType || m.type === "destination");

  // Safe route update helper for WebGL lines
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

        // Outer glow / casing
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
            "line-width": 9,
            "line-opacity": 0.35,
          },
        });

        // Core route path
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

    // Add standard navigation controls (zoom + compass)
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

  // Sync Markers on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear previous markers
    activeMarkersRef.current.forEach((m) => m.remove());
    activeMarkersRef.current = [];

    filteredMarkers.forEach((marker) => {
      // Create custom DOM element for marker
      const el = document.createElement("div");
      el.className = "group cursor-pointer select-none";

      let bgClass = "bg-blue-600";
      let displayContent = "D";

      if (marker.type === "attraction") {
        bgClass = "bg-emerald-600";
        displayContent = marker.order !== undefined ? String(marker.order) : "★";
      } else if (marker.type === "hotel") {
        bgClass = "bg-amber-600";
        displayContent = marker.order !== undefined ? String(marker.order) : "H";
      } else if (marker.type === "restaurant") {
        bgClass = "bg-rose-600";
        displayContent = marker.order !== undefined ? String(marker.order) : "R";
      } else if (marker.order !== undefined) {
        displayContent = String(marker.order);
      }

      const isSelected = marker.isSelected;
      const size = isSelected ? "w-9 h-9 text-xs" : "w-7 h-7 text-[11px]";
      const ring = isSelected
        ? "ring-4 ring-blue-500/50 shadow-xl scale-110"
        : "shadow-md hover:scale-110";

      el.innerHTML = `
        <div class="relative flex items-center justify-center transition-transform duration-200">
          <div class="${size} rounded-full ${bgClass} ${ring} text-white font-bold flex items-center justify-center border-2 border-white">
            ${displayContent}
          </div>
          ${
            isSelected
              ? `<div class="absolute -inset-1 rounded-full bg-blue-500/25 animate-ping pointer-events-none"></div>`
              : ""
          }
        </div>
      `;

      // Build rich MapLibre Popup
      const popupHtml = `
        <div class="space-y-1.5 font-sans min-w-[190px]">
          <div class="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-100">
            <span class="font-bold text-slate-900 text-xs tracking-tight line-clamp-1">
              ${marker.name}
            </span>
            <span class="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
              ${marker.type}
            </span>
          </div>

          ${
            marker.details?.category
              ? `<p class="text-[11px] text-slate-600">${marker.details.category}</p>`
              : ""
          }
          ${
            marker.details?.cuisine
              ? `<p class="text-[11px] text-slate-700 font-medium">🍽️ Cuisine: ${marker.details.cuisine}</p>`
              : ""
          }
          ${
            marker.details?.price !== undefined
              ? `<p class="text-xs font-semibold text-emerald-600">Rate: ₹${marker.details.price}</p>`
              : ""
          }
          ${
            marker.details?.rating
              ? `<p class="text-[11px] text-amber-500 font-bold">★ ${marker.details.rating} / 5.0</p>`
              : ""
          }
          ${
            marker.details?.hours
              ? `<p class="text-[10px] text-slate-400">⏱️ ${marker.details.hours}</p>`
              : ""
          }
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: true,
        closeOnClick: true,
        maxWidth: "260px",
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
        padding: { top: 60, bottom: 60, left: 60, right: 60 },
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

  // 3D Perspective Tilt Toggle
  const toggle3D = () => {
    const map = mapRef.current;
    if (!map) return;

    if (is3D) {
      map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
      setIs3D(false);
    } else {
      map.easeTo({ pitch: 52, bearing: -15, duration: 800 });
      setIs3D(true);
    }
  };

  // Fullscreen expansion toggle
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      mapRef.current?.resize();
    }, 150);
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-card flex flex-col transition-all duration-300 ${
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
            Layer:
          </span>
          {[
            { id: "all", label: "All Sights" },
            { id: "attraction", label: "Attractions", icon: Compass },
            { id: "hotel", label: "Hotels", icon: Building },
            { id: "restaurant", label: "Dining", icon: Utensils },
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
            title="Toggle 3D Perspective Tilt"
          >
            <Box className="w-3 h-3" />
            <span>3D</span>
          </button>

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

      {/* 2. MapLibre GL WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full bg-slate-100"
        style={{ minHeight: "260px" }}
      />

      {/* 3. Bottom Route Information & Attribution Bar */}
      {routeDistanceKm !== undefined && routeDistanceKm > 0 && (
        <div className="p-2.5 bg-white/95 backdrop-blur border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs z-10">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Route Distance:{" "}
              <strong className="text-slate-900 font-semibold">
                {routeDistanceKm} km
              </strong>
            </span>

            {routeDurationMinutes !== undefined && (
              <span className="flex items-center gap-1.5 text-slate-600">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                Est. Duration:{" "}
                <strong className="text-slate-900 font-semibold">
                  {routeDurationMinutes < 60
                    ? `${routeDurationMinutes} mins`
                    : `${Math.floor(routeDurationMinutes / 60)}h ${
                        routeDurationMinutes % 60
                      }m`}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] text-slate-600 font-mono border-slate-200 bg-slate-50"
            >
              MapLibre GL JS • OpenStreetMap
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
