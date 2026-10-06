"use client";

import React, { useState } from "react";
import { ShieldCheck, Clock, ChevronRight } from "lucide-react";
import { placeComfortService } from "@/lib/services/place-comfort-service";
import { PlaceComfortProfile } from "@/types/place-comfort";
import { PlaceComfortModal } from "@/components/travel/place-comfort-modal";

interface PlaceComfortBadgeProps {
  placeName: string;
  placeId?: string;
  destination?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  variant?: "pill" | "banner" | "compact";
  className?: string;
}

export function PlaceComfortBadge({
  placeName,
  placeId,
  destination,
  category,
  latitude,
  longitude,
  variant = "pill",
  className = "",
}: PlaceComfortBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<PlaceComfortProfile | null>(null);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile) {
      const generated = placeComfortService.getPlaceComfortProfile({
        placeId,
        placeName,
        destination,
        category,
        latitude,
        longitude,
      });
      setProfile(generated);
    }
    setIsOpen(true);
  };

  // Pre-calculate better time window synchronously
  const betterWindow = React.useMemo(() => {
    const prof = placeComfortService.getPlaceComfortProfile({
      placeId,
      placeName,
      destination,
      category,
      latitude,
      longitude,
    });
    return prof.betterTimeToVisit.timeWindow;
  }, [placeId, placeName, destination, category, latitude, longitude]);

  if (variant === "compact") {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[11px] font-medium transition-colors ${className}`}
          title="Click to view Area Comfort & Safety signals"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>Optimal: {betterWindow}</span>
        </button>

        <PlaceComfortModal profile={profile} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  if (variant === "banner") {
    return (
      <>
        <div
          onClick={handleOpen}
          className={`p-3 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 hover:from-emerald-100/70 hover:to-teal-100/70 transition-all cursor-pointer flex items-center justify-between gap-3 ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span>Travel Comfort & Safety Profile</span>
                <span className="text-[10px] text-emerald-700 font-normal">🟢 🟡 🟢</span>
              </div>
              <div className="text-[11px] text-emerald-800">
                Better time to visit: <strong className="font-semibold">{betterWindow}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 shrink-0">
            <span>View Signals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <PlaceComfortModal profile={profile} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </>
    );
  }

  // Default Pill Variant
  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200 text-xs font-medium shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all ${className}`}
        title="View Crowd, Transport, Lighting and Safety signals"
      >
        <span className="flex items-center gap-0.5 text-[9px]">
          <span>🟢</span>
          <span>🟡</span>
        </span>
        <span className="font-semibold text-emerald-950">Comfort Profile:</span>
        <span className="text-emerald-800">{betterWindow}</span>
      </button>

      <PlaceComfortModal profile={profile} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
