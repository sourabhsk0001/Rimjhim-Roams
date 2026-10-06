"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin } from "lucide-react";
import type { MapInnerProps, MapMarkerItem } from "./map-inner";

// Dynamic import with ssr: false to prevent window is undefined errors during Next.js SSR
const DynamicMap = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-xl border bg-muted/30 flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
        <MapPin className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span>Loading interactive MapLibre GL JS & OpenStreetMap canvas...</span>
      </div>
    </div>
  ),
});

export type { MapMarkerItem, MapInnerProps as InteractiveMapProps };

export function InteractiveMap(props: MapInnerProps) {
  return <DynamicMap {...props} />;
}

export default InteractiveMap;
