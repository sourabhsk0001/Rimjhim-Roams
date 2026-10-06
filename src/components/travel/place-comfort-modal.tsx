"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Users,
  Moon,
  Bus,
  SunMedium,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlaceComfortProfile, ComfortSignal } from "@/types/place-comfort";

interface PlaceComfortModalProps {
  profile: PlaceComfortProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaceComfortModal({
  profile,
  isOpen,
  onClose,
}: PlaceComfortModalProps) {
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  if (!isOpen || !profile) return null;

  const toggleExpand = (id: string) => {
    setExpandedSignalId((prev) => (prev === id ? null : id));
  };

  const getSignalIcon = (id: string) => {
    switch (id) {
      case "crowd_level":
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "late_night_access":
        return <Moon className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "transport":
        return <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "tourist_density":
        return <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "weather_concern":
        return <SunMedium className="w-4 h-4 text-amber-500" />;
      default:
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-comfort-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Travel Comfort & Environmental Signals
              </span>
            </div>
            <h2
              id="place-comfort-title"
              className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white"
            >
              {profile.placeName}
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{profile.areaName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1 text-sm">
          
          {/* Transparency Principle Banner */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-white block mb-0.5">
                Transparent Signals — No Black-Box AI &quot;Safety Scores&quot;
              </strong>
              Instead of an arbitrary single number, Rimjhim Roams displays verified public signals (transit nodes, illumination, crowd hours, official timings) and verifiable sources so you can make informed personal travel decisions.
            </div>
          </div>

          {/* Better Time to Visit Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-sky-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Optimal Visiting Window
              </span>
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-xs">
                Recommended
              </Badge>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-950 dark:text-emerald-100">
              {profile.betterTimeToVisit.timeWindow}
            </div>
            <p className="text-xs text-emerald-800/90 dark:text-emerald-200/90 leading-relaxed">
              {profile.betterTimeToVisit.reason}
            </p>
          </div>

          {/* Area Signals Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Area Comfort & Environmental Signals
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                Click any row for public source details
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800/80 overflow-hidden bg-white dark:bg-zinc-900/40">
              {profile.signals.map((signal) => {
                const isExpanded = expandedSignalId === signal.id;
                return (
                  <div key={signal.id} className="transition-colors">
                    <button
                      onClick={() => toggleExpand(signal.id)}
                      className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 shrink-0">
                          {getSignalIcon(signal.id)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 dark:text-zinc-100 text-sm block">
                            {signal.label}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400 truncate block">
                            {signal.statusText}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-base sm:text-lg" title={signal.statusText}>
                          {signal.iconEmoji}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Expandable detail card */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 bg-slate-50/70 dark:bg-zinc-900/80 border-t border-slate-100 dark:border-zinc-800 text-xs space-y-2">
                        <p className="text-slate-700 dark:text-zinc-300 leading-relaxed">
                          {signal.detail}
                        </p>
                        <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-zinc-400">
                          <span className="font-medium">
                            Source: <span className="text-slate-700 dark:text-zinc-300">{signal.source}</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                            Verified {new Date(signal.retrieved_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verified Public Sources List */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Underlying Public Datasets & Citations
            </h4>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
              {profile.verifiedSources.map((src, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-slate-400 font-mono text-[11px] shrink-0">•</span>
                  <div>
                    <strong className="text-slate-800 dark:text-zinc-200 font-semibold">{src.name}</strong> ({src.authority}) — {src.coverage}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>In an emergency, always dial <strong>112</strong></span>
          <Button size="sm" variant="outline" onClick={onClose} className="h-8">
            Close Profile
          </Button>
        </div>

      </div>
    </div>
  );
}
