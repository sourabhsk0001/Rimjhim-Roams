"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Sparkles,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  X,
  Compass,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ReplanDayResult,
  ReplanChange,
  ReplanChangeType,
} from "@/types/replanning";
import { ItineraryItem } from "@/types/time";

interface ReplanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  dayNumber: number;
  dayDate: string;
  onApplied: () => void;
}

export function ReplanModal({
  isOpen,
  onClose,
  tripId,
  dayNumber,
  dayDate,
  onApplied,
}: ReplanModalProps) {
  const [delayMinutes, setDelayMinutes] = useState<number>(45);
  const [customTime, setCustomTime] = useState<string>("");
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(false);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    name: string;
  } | null>(null);
  const [locLoading, setLocLoading] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [loadingPreview, setLoadingLoading] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<ReplanDayResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = useCallback(
    async (delay: number = delayMinutes, timeStr: string = customTime) => {
      setLoadingLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/trips/${tripId}/replan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayNumber,
            delayMinutes: timeStr ? undefined : delay,
            currentTime: timeStr || undefined,
            currentLocation: useCurrentLocation && currentCoords ? currentCoords : undefined,
            apply: false,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to preview replanned itinerary.");
        }
        setPreviewResult(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to preview replan");
      } finally {
        setLoadingLoading(false);
      }
    },
    [tripId, dayNumber, delayMinutes, customTime, useCurrentLocation, currentCoords]
  );

  // Reset or run initial preview when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      handlePreview(45, "");
    }
  }, [isOpen, handlePreview]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          name: "My Live Location",
        });
        setUseCurrentLocation(true);
        setLocLoading(false);
      },
      () => {
        setLocError("Unable to retrieve location. Using hotel/scheduled start.");
        setLocLoading(false);
      }
    );
  };

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/replan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayNumber,
          delayMinutes: customTime ? undefined : delayMinutes,
          currentTime: customTime || undefined,
          currentLocation: useCurrentLocation && currentCoords ? currentCoords : undefined,
          apply: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to apply replanned schedule.");
      }
      onApplied();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to apply schedule");
    } finally {
      setApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Re-plan My Day</h2>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300">
                  Day {dayNumber} • {dayDate}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time dynamic recovery for schedule delays, weather shifts, and closing hours.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Replanning Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Input Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border">
            {/* Delay Presets */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">I am running late by:</Label>
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <Button
                    key={mins}
                    type="button"
                    size="sm"
                    variant={delayMinutes === mins && !customTime ? "default" : "outline"}
                    className={`text-xs h-8 ${
                      delayMinutes === mins && !customTime
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : ""
                    }`}
                    onClick={() => {
                      setDelayMinutes(mins);
                      setCustomTime("");
                      handlePreview(mins, "");
                    }}
                  >
                    +{mins}m {mins === 45 ? "★" : ""}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Current Time */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Or exact current time:</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={customTime}
                  onChange={(e) => {
                    setCustomTime(e.target.value);
                    if (e.target.value) {
                      handlePreview(delayMinutes, e.target.value);
                    }
                  }}
                  className="h-8 text-xs"
                />
                {customTime && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs px-2"
                    onClick={() => {
                      setCustomTime("");
                      handlePreview(delayMinutes, "");
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Location Permission */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">Current Location (Routing):</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={useCurrentLocation ? "default" : "outline"}
                  className="text-xs h-8 gap-1.5 w-full"
                  onClick={handleDetectLocation}
                  disabled={locLoading}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {locLoading
                    ? "Locating..."
                    : useCurrentLocation && currentCoords
                    ? "GPS Active"
                    : "Detect Live Location"}
                </Button>
              </div>
              {locError && <p className="text-[10px] text-destructive">{locError}</p>}
            </div>
          </div>

          {/* Replanning Summary Metric Bar */}
          {previewResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Delay Absorbed</span>
                <p className="text-lg font-bold text-purple-600 mt-0.5">
                  +{previewResult.summary.delayMinutes}m
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Starts at {previewResult.currentTime}
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Landmarks Preserved</span>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">
                  {previewResult.summary.itemsPreserved} / {previewResult.summary.totalOriginalItems}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {previewResult.summary.itemsRemoved} removed
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Schedule Modifications</span>
                <p className="text-lg font-bold text-blue-600 mt-0.5">
                  {previewResult.summary.itemsMoved + previewResult.summary.itemsShortened}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {previewResult.summary.itemsShortened} shortened, {previewResult.summary.itemsMoved} shifted
                </span>
              </div>

              <div className="p-3 rounded-xl border bg-card">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Budget Impact</span>
                <p className="text-lg font-bold mt-0.5">
                  {previewResult.budget.replannedCostFormatted}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {previewResult.budget.costDifference >= 0
                    ? `+${previewResult.budget.costDifferenceFormatted}`
                    : previewResult.budget.costDifferenceFormatted}
                </span>
              </div>
            </div>
          )}

          {/* Change Rationale Breakdown */}
          {previewResult && previewResult.changes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Modifications & Rationale ({previewResult.changes.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {previewResult.changes.map((change) => (
                  <ChangeRationaleCard key={change.id} change={change} />
                ))}
              </div>
            </div>
          )}

          {/* Before & After Comparison */}
          {previewResult && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Schedule Comparison: Before vs After</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before: Original Schedule */}
                <Card className="border-dashed bg-muted/10">
                  <CardHeader className="py-3 px-4 border-b">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Original Schedule</span>
                      <span>{previewResult.originalItems.length} items</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {previewResult.originalItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg border bg-background/50 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold truncate">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              {item.start_time} - {item.end_time} ({item.visit_minutes}m)
                            </span>
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {item.category}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* After: Replanned Schedule */}
                <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/20">
                  <CardHeader className="py-3 px-4 border-b bg-purple-50/40 dark:bg-purple-950/20">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center justify-between">
                      <span>Replanned Schedule</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Feasible & Optimized
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {previewResult.replannedItems.map((item, idx) => {
                      const changeTag = getChangeTagForItem(item, previewResult.changes);
                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg border bg-background flex items-center justify-between text-xs shadow-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{item.title}</p>
                              {changeTag && (
                                <Badge
                                  className={`text-[9px] px-1.5 py-0 h-4 ${getChangeBadgeStyle(
                                    changeTag.type
                                  )}`}
                                >
                                  {changeTag.type.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-purple-600" />
                              <span>
                                {item.start_time} - {item.end_time} ({item.visit_minutes}m)
                              </span>
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {item.category}
                          </Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t flex items-center justify-between bg-muted/20">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={applying}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreview(delayMinutes, customTime)}
              disabled={loadingPreview || applying}
              className="text-xs"
            >
              {loadingPreview ? "Recalculating..." : "Refresh Preview"}
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={applying || loadingPreview || !previewResult?.success}
              className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              {applying ? "Applying Schedule..." : "Apply Replanned Itinerary"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Helper Components
// ----------------------------------------------------------------------------

function ChangeRationaleCard({ change }: { change: ReplanChange }) {
  const badgeStyle = getChangeBadgeStyle(change.type);

  return (
    <div className="p-3 rounded-xl border bg-card text-xs flex flex-col justify-between space-y-1.5 shadow-2xs">
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold truncate text-foreground">{change.itemTitle}</span>
        <Badge className={`text-[10px] px-2 py-0.5 uppercase tracking-wide shrink-0 ${badgeStyle}`}>
          {change.type}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-semibold text-foreground/80">Reason: </span>
        {change.reason}
      </p>

      {change.before && change.after && (
        <div className="pt-1 border-t text-[11px] text-muted-foreground flex items-center gap-2">
          <span>{change.before.start_time} ({change.before.visit_minutes}m)</span>
          <ArrowRight className="w-3 h-3 text-purple-600 shrink-0" />
          <span className="font-medium text-purple-700 dark:text-purple-300">
            {change.after.start_time} ({change.after.visit_minutes}m)
          </span>
        </div>
      )}
    </div>
  );
}

function getChangeTagForItem(item: ItineraryItem, changes: ReplanChange[]): ReplanChange | undefined {
  return changes.find((c) => c.itemId === item.id);
}

function getChangeBadgeStyle(type: ReplanChangeType): string {
  switch (type) {
    case "removed":
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300";
    case "added":
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300";
    case "moved":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300";
    case "shortened":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300";
    case "extended":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}
