// ==============================================================================
// Real-time Itinerary Replanning Engine
//
// Invariant:
// 1. Never simply regenerate the entire trip randomly.
// 2. Preserve important existing activities where possible.
// 3. Keep visit_time, travel_time, waiting_time, buffer_time strictly separate.
// 4. Track discrete diff categories: Added, Removed, Moved, Shortened, Extended with reasons.
// ==============================================================================

import {
  ItineraryItem,
  DayItineraryData,
  ScheduleValidationResult,
  DailyTimeAllocation,
  ItemLocation,
  ItineraryItemCategory,
  ItemPriority,
} from "@/types/time";
import {
  ReplanChange,
  ReplanChangeType,
  ReplanDayInput,
  ReplanDayResult,
  ReplanSummary,
  ReplanBudgetComparison,
} from "@/types/replanning";
import {
  timeEngine,
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
} from "@/lib/time/engine";
import { getTripById } from "@/lib/services/trip-service";
import {
  getItineraryDay,
  persistOptimizedItems,
  getTripItineraries,
} from "@/lib/services/itinerary-service";
import { weatherService } from "@/lib/services/weather-service";
import { HourlyWeather } from "@/types/weather";
import { formatCurrency } from "@/lib/budget/money";
import {
  DEMO_ATTRACTIONS,
  getDestinationAttractions,
} from "@/lib/services/travel-data-service";
import { Attraction } from "@/types/travel";

export interface ReplanTripParams extends ReplanDayInput {
  // Aliases and extension options for trip-level replanning
}

export class ReplanEngine {
  /**
   * Main entry point: replanDay
   * Recalculates remaining attractions, travel, visit duration, opening hours,
   * weather conflicts, food, rest, buffer, and budget when a delay or location change occurs.
   */
  async replanDay(input: ReplanDayInput): Promise<ReplanDayResult> {
    const tripId = input.tripId;
    const dayNumber = input.dayNumber || 1;
    const userId = input.userId || "anonymous";

    // 1. Fetch authorized trip and current day itinerary
    const { trip } = await getTripById(tripId, userId);
    const dayRes = await getItineraryDay(tripId, dayNumber, userId);

    if (!dayRes.success || !dayRes.day) {
      return this.buildFallbackEmptyResult(
        tripId,
        dayNumber,
        input.currentTime || "09:00",
        input.delayMinutes || 0,
        dayRes.error || "Itinerary day not found"
      );
    }

    const day = dayRes.day;
    const originalItems = [...day.items].sort((a, b) => a.sort_order - b.sort_order);

    if (originalItems.length === 0) {
      return this.buildFallbackEmptyResult(
        tripId,
        dayNumber,
        input.currentTime || "09:00",
        input.delayMinutes || 0,
        "No activities found in today's schedule to replan."
      );
    }

    // 2. Establish Time Cursor & Delay
    const delayMinutes = Math.max(0, input.delayMinutes || 0);
    const completedIds = new Set(input.completedItemIds || []);

    // Determine current time
    let currentTime = input.currentTime;
    if (!currentTime) {
      if (delayMinutes > 0) {
        // If 45m late, start time is baseline first pending item start + delay
        const firstPending = originalItems.find((it) => !completedIds.has(it.id)) || originalItems[0];
        currentTime = addMinutesToTime(firstPending.start_time, delayMinutes);
      } else {
        currentTime = originalItems[0]?.start_time || "09:00";
      }
    }

    const currentMins = timeToMinutes(currentTime);
    const dayStartMins = timeToMinutes(day.day_start_time || "08:30");
    const dayEndMins = timeToMinutes(day.day_end_time || "21:30");

    // 3. Separate Completed / Past Items from Remaining Items
    const completedItems: ItineraryItem[] = [];
    const pendingItems: ItineraryItem[] = [];

    for (const item of originalItems) {
      const itemEndMins = timeToMinutes(item.end_time);
      if (completedIds.has(item.id) || itemEndMins <= currentMins) {
        completedItems.push({
          ...item,
          status: "completed",
        });
      } else {
        pendingItems.push(item);
      }
    }

    // Determine starting location for remaining route
    let currentOriginLoc: ItemLocation;
    if (input.currentLocation) {
      currentOriginLoc = input.currentLocation;
    } else if (completedItems.length > 0) {
      currentOriginLoc = completedItems[completedItems.length - 1].location;
    } else {
      currentOriginLoc = originalItems[0].location;
    }

    // 4. Fetch Weather Forecast for the Day
    let hourlyWeather = input.weatherForecast;
    if (!hourlyWeather || hourlyWeather.length === 0) {
      try {
        const destName = trip?.destination || "Goa";
        const coords = weatherService.resolveCoordinates(destName);
        const forecast = await weatherService.getForecast(
          coords.latitude,
          coords.longitude,
          Math.max(1, trip?.duration_days || 3),
          coords.locationName
        );
        hourlyWeather = forecast.hourly;
      } catch {
        hourlyWeather = [];
      }
    }

    const hourlyMap = new Map<number, HourlyWeather>();
    for (const h of hourlyWeather || []) {
      hourlyMap.set(h.hour, h);
    }

    // Fetch candidate indoor attractions for weather substitutions
    let candidateIndoor: Attraction[] = [];
    try {
      const destName = trip?.destination || "Goa";
      const coords = weatherService.resolveCoordinates(destName);
      candidateIndoor = await weatherService.getCandidateIndoorAttractions(coords.destinationId);
    } catch {
      candidateIndoor = [];
    }

    // 5. Deterministic Replanning of Remaining Schedule
    const replannedPendingItems: ItineraryItem[] = [];
    const changes: ReplanChange[] = [];
    let cursorMins = Math.max(currentMins, dayStartMins);
    let prevLoc = currentOriginLoc;
    const removedItemIds = new Set<string>();

    // Sort pending items to preserve must_visit and high priority
    // Priority weights: must_visit (0) > high (1) > food (2) > medium (3) > low (4)
    const priorityWeight = (it: ItineraryItem): number => {
      if (it.priority === "must_visit") return 0;
      if (it.priority === "high") return 1;
      if (it.category === "food") return 2;
      if (it.priority === "medium") return 3;
      return 4;
    };

    // Keep chronological sequence unless severe compression is required
    let activeCandidates = [...pendingItems];
    const deferredWeatherItems = new Map<string, number>();

    for (let i = 0; i < activeCandidates.length; i++) {
      const sight = activeCandidates[i];

      // A. Weather Check for Outdoor Activities (e.g. Beach / Open Viewpoint)
      const isOutdoor =
        sight.category === "sightseeing" &&
        (sight.title.toLowerCase().includes("beach") ||
          sight.title.toLowerCase().includes("park") ||
          sight.title.toLowerCase().includes("viewpoint") ||
          sight.title.toLowerCase().includes("promenade") ||
          sight.title.toLowerCase().includes("water sports"));

      if (deferredWeatherItems.has(sight.id)) {
        // Already moved to dry window! Advance cursor to dry start and proceed
        const dryStartMins = deferredWeatherItems.get(sight.id)!;
        cursorMins = Math.max(cursorMins, dryStartMins);
      } else if (isOutdoor) {
        let scheduledWeatherHour = Math.floor(cursorMins / 60);
        let currentWeather = hourlyMap.get(scheduledWeatherHour);
        let isAdverse = currentWeather ? weatherService.isAdverseWeather(currentWeather) : false;

        // Scenario: Weather conflict at current time
        if (isAdverse) {
          // Look for a later dry window in remaining day hours
          let dryHour: number | null = null;
          for (let h = scheduledWeatherHour + 1; h < Math.floor(dayEndMins / 60); h++) {
            const w = hourlyMap.get(h);
            if (w && !weatherService.isAdverseWeather(w)) {
              dryHour = h;
              break;
            }
          }

          if (dryHour !== null) {
            // Move the outdoor sight to the dry hour slot!
            const newStartMins = dryHour * 60;
            if (newStartMins + sight.visit_minutes <= dayEndMins) {
              deferredWeatherItems.set(sight.id, newStartMins);

              // Reorder: defer this sight to the dry window slot
              changes.push({
                id: `change-move-${sight.id}`,
                type: "moved",
                itemId: sight.id,
                itemTitle: sight.title,
                category: sight.category,
                reason: `Moved to ${minutesToTime(newStartMins)} for better weather window (${currentWeather?.condition} predicted earlier).`,
                before: {
                  start_time: sight.start_time,
                  end_time: sight.end_time,
                  visit_minutes: sight.visit_minutes,
                  location: sight.location,
                },
                after: {
                  start_time: minutesToTime(newStartMins),
                  end_time: minutesToTime(newStartMins + sight.visit_minutes),
                  visit_minutes: sight.visit_minutes,
                  location: sight.location,
                },
              });

              // If there are subsequent candidates, re-insert this sight at its new chronological position
              if (i < activeCandidates.length - 1) {
                activeCandidates.splice(i, 1);
                let insertIdx = activeCandidates.length;
                for (let k = i; k < activeCandidates.length; k++) {
                  const targetK =
                    deferredWeatherItems.get(activeCandidates[k].id) ??
                    timeToMinutes(activeCandidates[k].start_time);
                  if (targetK > newStartMins) {
                    insertIdx = k;
                    break;
                  }
                }
                activeCandidates.splice(insertIdx, 0, sight);
                i--;
                continue;
              } else {
                cursorMins = Math.max(cursorMins, newStartMins);
              }
            }
          } else if (candidateIndoor.length > 0) {
            const indoorSubstitute = candidateIndoor.shift()!;
            changes.push({
              id: `change-remove-${sight.id}`,
              type: "removed",
              itemId: sight.id,
              itemTitle: sight.title,
              category: sight.category,
              reason: `Adverse weather (${currentWeather?.condition}) and no valid dry window remaining.`,
              before: {
                start_time: sight.start_time,
                end_time: sight.end_time,
                visit_minutes: sight.visit_minutes,
                location: sight.location,
              },
            });
            removedItemIds.add(sight.id);

            // Insert indoor alternative in its place
            const travelMins = timeEngine.calculateTravelDuration(prevLoc, {
              latitude: indoorSubstitute.latitude,
              longitude: indoorSubstitute.longitude,
              name: indoorSubstitute.name,
            });
            const visitMins = indoorSubstitute.recommended_visit_minutes || 60;
            const startMins = cursorMins + travelMins;
            const endMins = startMins + visitMins;

            const addedItem: ItineraryItem = {
              id: `item-indoor-${Date.now()}-${indoorSubstitute.id}`,
              itinerary_id: sight.itinerary_id,
              trip_id: sight.trip_id,
              attraction_id: indoorSubstitute.id,
              title: indoorSubstitute.name,
              category: "sightseeing",
              date: sight.date,
              start_time: minutesToTime(startMins),
              end_time: minutesToTime(endMins),
              location: {
                latitude: indoorSubstitute.latitude,
                longitude: indoorSubstitute.longitude,
                name: indoorSubstitute.name,
              },
              visit_minutes: visitMins,
              travel_minutes: travelMins,
              waiting_minutes: 10,
              buffer_minutes: 15,
              estimated_cost: indoorSubstitute.ticket_price || 0,
              priority: "high",
              status: "scheduled",
              duration_tier: "Normal",
              sort_order: replannedPendingItems.length + completedItems.length,
            };

            changes.push({
              id: `change-add-${addedItem.id}`,
              type: "added",
              itemId: addedItem.id,
              itemTitle: addedItem.title,
              category: addedItem.category,
              reason: `Added indoor cultural experience to replace rain-affected activity (${sight.title}).`,
              after: {
                start_time: addedItem.start_time,
                end_time: addedItem.end_time,
                visit_minutes: addedItem.visit_minutes,
                location: addedItem.location,
              },
            });

            replannedPendingItems.push(addedItem);
            cursorMins = endMins + addedItem.buffer_minutes;
            prevLoc = addedItem.location;
            continue;
          }
        }
      }

      // B. Travel Duration Calculation
      const travelMins = timeEngine.calculateTravelDuration(prevLoc, sight.location);
      let arrivalMins = cursorMins + travelMins;

      // C. Opening Hours Check
      if (sight.opening_time) {
        const openMins = timeToMinutes(sight.opening_time);
        if (arrivalMins < openMins) {
          arrivalMins = openMins;
        }
      }

      // D. Closing Hours Check
      let visitMins = sight.visit_minutes || 60;
      const minDwell = Math.max(20, Math.round(visitMins * 0.5));

      if (sight.closing_time) {
        const closeMins = timeToMinutes(sight.closing_time);
        if (arrivalMins + minDwell > closeMins) {
          // Closed by the time we arrive! Must be removed.
          changes.push({
            id: `change-remove-${sight.id}`,
            type: "removed",
            itemId: sight.id,
            itemTitle: sight.title,
            category: sight.category,
            reason: `Attraction closes at ${sight.closing_time}; insufficient time for visit after arrival (${minutesToTime(arrivalMins)}).`,
            before: {
              start_time: sight.start_time,
              end_time: sight.end_time,
              visit_minutes: sight.visit_minutes,
              location: sight.location,
            },
          });
          removedItemIds.add(sight.id);
          continue;
        } else if (arrivalMins + visitMins > closeMins) {
          // Dwell must be shortened to finish before closing
          const oldVisit = visitMins;
          visitMins = closeMins - arrivalMins;
          changes.push({
            id: `change-shorten-${sight.id}`,
            type: "shortened",
            itemId: sight.id,
            itemTitle: sight.title,
            category: sight.category,
            reason: `Shortened from ${oldVisit}m to ${visitMins}m to finish before closing (${sight.closing_time}).`,
            before: {
              start_time: sight.start_time,
              end_time: sight.end_time,
              visit_minutes: oldVisit,
              location: sight.location,
            },
            after: {
              start_time: minutesToTime(arrivalMins),
              end_time: minutesToTime(arrivalMins + visitMins),
              visit_minutes: visitMins,
              location: sight.location,
            },
          });
        }
      }

      // E. Schedule Delays & Time Compression ("Shortened" vs "Removed")
      // Check if arrival + visit exceeds day capacity
      const remainingDayMins = dayEndMins - arrivalMins;

      if (remainingDayMins < minDwell) {
        // Insufficient remaining time in daily schedule
        changes.push({
          id: `change-remove-${sight.id}`,
          type: "removed",
          itemId: sight.id,
          itemTitle: sight.title,
          category: sight.category,
          reason: "Insufficient remaining time in daily schedule.",
          before: {
            start_time: sight.start_time,
            end_time: sight.end_time,
            visit_minutes: sight.visit_minutes,
            location: sight.location,
          },
        });
        removedItemIds.add(sight.id);
        continue;
      }

      // If user is delayed (e.g. 45m late) and visit can be compressed to save the rest of the day:
      let wasCompressed = false;
      const originalVisitMins = sight.visit_minutes;
      if (
        delayMinutes >= 30 &&
        sight.category === "sightseeing" &&
        originalVisitMins >= 60 &&
        arrivalMins + originalVisitMins > dayEndMins - 60
      ) {
        // Compress visit duration (e.g. 120m -> 75m or 90m -> 60m)
        const compressedMins = Math.max(30, Math.round(originalVisitMins * 0.65));
        if (originalVisitMins - compressedMins >= 15) {
          visitMins = compressedMins;
          wasCompressed = true;
          changes.push({
            id: `change-shorten-${sight.id}`,
            type: "shortened",
            itemId: sight.id,
            itemTitle: sight.title,
            category: sight.category,
            reason: `Compressed visit from ${originalVisitMins}m to ${visitMins}m to recover ${delayMinutes}-minute delay while keeping landmark on itinerary.`,
            before: {
              start_time: sight.start_time,
              end_time: sight.end_time,
              visit_minutes: originalVisitMins,
              location: sight.location,
            },
            after: {
              start_time: minutesToTime(arrivalMins),
              end_time: minutesToTime(arrivalMins + visitMins),
              visit_minutes: visitMins,
              location: sight.location,
            },
          });
        }
      }

      // F. Queue / Waiting & Buffer
      const waitMins = sight.waiting_minutes || 0;
      const bufferMins = timeEngine.calculateBuffer(travelMins, visitMins);

      const startMins = arrivalMins + waitMins;
      const endMins = startMins + visitMins;

      // Detect if start_time moved significantly (>= 10 minutes)
      const oldStartMins = timeToMinutes(sight.start_time);
      const startShift = Math.abs(startMins - oldStartMins);
      if (startShift >= 10 && !wasCompressed && !deferredWeatherItems.has(sight.id)) {
        changes.push({
          id: `change-move-${sight.id}`,
          type: "moved",
          itemId: sight.id,
          itemTitle: sight.title,
          category: sight.category,
          reason: `Adjusted start time from ${sight.start_time} to ${minutesToTime(startMins)} to absorb schedule delay.`,
          before: {
            start_time: sight.start_time,
            end_time: sight.end_time,
            visit_minutes: sight.visit_minutes,
            location: sight.location,
          },
          after: {
            start_time: minutesToTime(startMins),
            end_time: minutesToTime(endMins),
            visit_minutes: visitMins,
            location: sight.location,
          },
        });
      }

      const scheduledItem: ItineraryItem = {
        ...sight,
        start_time: minutesToTime(startMins),
        end_time: minutesToTime(endMins),
        visit_minutes: visitMins,
        travel_minutes: travelMins,
        waiting_minutes: waitMins,
        buffer_minutes: bufferMins,
        sort_order: completedItems.length + replannedPendingItems.length,
      };

      replannedPendingItems.push(scheduledItem);
      cursorMins = endMins + bufferMins;
      prevLoc = sight.location;
    }

    // Combine completed historical items with newly replanned items
    const finalReplannedItems: ItineraryItem[] = [
      ...completedItems,
      ...replannedPendingItems,
    ].map((item, idx) => ({ ...item, sort_order: idx }));

    // 6. Schedule Validation & Time Allocation
    const validation = timeEngine.validateDailySchedule(finalReplannedItems, {
      start: day.day_start_time || "08:30",
      end: day.day_end_time || "21:30",
    });

    const timeAllocation = timeEngine.calculateTotalTimeAllocation(
      finalReplannedItems,
      {
        start: day.day_start_time || "08:30",
        end: day.day_end_time || "21:30",
      }
    );

    // 7. Budget Delta Calculation
    const originalCost = originalItems.reduce((acc, it) => acc + (it.estimated_cost || 0), 0);
    const replannedCost = finalReplannedItems.reduce((acc, it) => acc + (it.estimated_cost || 0), 0);
    const costDifference = replannedCost - originalCost;

    const budget: ReplanBudgetComparison = {
      originalCost,
      replannedCost,
      costDifference,
      originalCostFormatted: formatCurrency(originalCost, { currency: "INR" }),
      replannedCostFormatted: formatCurrency(replannedCost, { currency: "INR" }),
      costDifferenceFormatted: formatCurrency(costDifference, { currency: "INR" }),
      currency: "INR",
    };

    // 8. Deduplicate and finalize change list
    const dedupedChanges = this.deduplicateChanges(changes);

    const summary: ReplanSummary = {
      delayMinutes,
      currentTime,
      totalOriginalItems: originalItems.length,
      totalReplannedItems: finalReplannedItems.length,
      itemsPreserved: originalItems.length - removedItemIds.size,
      itemsRemoved: dedupedChanges.filter((c) => c.type === "removed").length,
      itemsAdded: dedupedChanges.filter((c) => c.type === "added").length,
      itemsMoved: dedupedChanges.filter((c) => c.type === "moved").length,
      itemsShortened: dedupedChanges.filter((c) => c.type === "shortened").length,
      itemsExtended: dedupedChanges.filter((c) => c.type === "extended").length,
    };

    // 9. Persist if requested
    let applied = false;
    if (input.apply) {
      await persistOptimizedItems(day.id, tripId, finalReplannedItems);
      applied = true;
    }

    return {
      success: true,
      tripId,
      dayNumber,
      date: day.date,
      currentTime,
      delayMinutes,
      originalItems,
      replannedItems: finalReplannedItems,
      changes: dedupedChanges,
      summary,
      validation,
      timeAllocation,
      budget,
      applied,
    };
  }

  /**
   * Trip-level helper: replans the requested or current active day of the trip
   */
  async replanTrip(params: ReplanTripParams): Promise<ReplanDayResult> {
    return this.replanDay(params);
  }

  // ----------------------------------------------------------------------------
  // Internal Helpers
  // ----------------------------------------------------------------------------

  private deduplicateChanges(changes: ReplanChange[]): ReplanChange[] {
    const byItem = new Map<string, ReplanChange>();
    for (const c of changes) {
      const existing = byItem.get(c.itemId);
      if (!existing) {
        byItem.set(c.itemId, c);
      } else if (c.type === "removed") {
        // "removed" is definitive and overrides intermediate moves
        byItem.set(c.itemId, c);
      } else if (existing.type !== "removed" && c.type === "shortened") {
        byItem.set(c.itemId, c);
      }
    }
    return Array.from(byItem.values());
  }

  private buildFallbackEmptyResult(
    tripId: string,
    dayNumber: number,
    currentTime: string,
    delayMinutes: number,
    errorMessage: string
  ): ReplanDayResult {
    return {
      success: false,
      tripId,
      dayNumber,
      date: new Date().toISOString().substring(0, 10),
      currentTime,
      delayMinutes,
      originalItems: [],
      replannedItems: [],
      changes: [],
      summary: {
        delayMinutes,
        currentTime,
        totalOriginalItems: 0,
        totalReplannedItems: 0,
        itemsPreserved: 0,
        itemsRemoved: 0,
        itemsAdded: 0,
        itemsMoved: 0,
        itemsShortened: 0,
        itemsExtended: 0,
      },
      validation: {
        isValid: false,
        errors: [
          {
            id: "err-replan-fallback",
            type: "insufficient_time",
            severity: "error",
            message: errorMessage,
            itemIds: [],
            suggestedFix: "Check itinerary items and available day time window.",
          },
        ],
        warnings: [],
        allocation: {
          availableMinutes: 0,
          travelMinutes: 0,
          sightseeingMinutes: 0,
          foodMinutes: 0,
          restMinutes: 0,
          waitingMinutes: 0,
          bufferMinutes: 0,
          totalAllocatedMinutes: 0,
          dayCapacityMinutes: 0,
        },
      },
      timeAllocation: {
        availableMinutes: 0,
        travelMinutes: 0,
        sightseeingMinutes: 0,
        foodMinutes: 0,
        restMinutes: 0,
        waitingMinutes: 0,
        bufferMinutes: 0,
        totalAllocatedMinutes: 0,
        dayCapacityMinutes: 0,
      },
      budget: {
        originalCost: 0,
        replannedCost: 0,
        costDifference: 0,
        originalCostFormatted: "₹0",
        replannedCostFormatted: "₹0",
        costDifferenceFormatted: "₹0",
        currency: "INR",
      },
      applied: false,
      error: errorMessage,
    };
  }
}

export const replanEngine = new ReplanEngine();

/**
 * Top-level convenience functions required by prompt
 */
export async function replanTrip(params: ReplanTripParams): Promise<ReplanDayResult> {
  return replanEngine.replanDay(params);
}

export async function replanDay(params: ReplanDayInput): Promise<ReplanDayResult> {
  return replanEngine.replanDay(params);
}
