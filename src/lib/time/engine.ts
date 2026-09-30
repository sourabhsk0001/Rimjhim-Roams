import {
  DurationTier,
  ItineraryItem,
  DailyTimeAllocation,
  ScheduleValidationResult,
  ScheduleValidationError,
  VisitCalculationParams,
  ItemLocation,
} from "@/types/time";

// ==============================================================================
// Time String Helper Functions
// ==============================================================================

/**
 * Converts "HH:MM" (or "H:MM AM/PM") into minutes from midnight (0..1439).
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim();

  // Handle 12-hour AM/PM format (e.g. "09:00 AM", "05:30 PM")
  const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const isPM = ampmMatch[3].toUpperCase() === "PM";
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Handle standard 24-hour "HH:MM" or "HH:MM:SS"
  const parts = clean.split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight into 24-hour "HH:MM" format.
 */
export function minutesToTime(minutesFromMidnight: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.round(minutesFromMidnight)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Adds minutes to an "HH:MM" string, returning a new "HH:MM" string.
 */
export function addMinutesToTime(timeStr: string, minutes: number): string {
  return minutesToTime(timeToMinutes(timeStr) + minutes);
}

// ==============================================================================
// TripWise Time Intelligence Engine
//
// INVARIANT RULE: For every itinerary item, visit_time, travel_time,
// waiting_time, and buffer_time are kept separate and NEVER combined internally.
// ==============================================================================

export class TimeEngine {
  /**
   * 1. calculateVisitDuration
   * Determines exact visit minutes based on metadata, tier, pace, traveller type,
   * weather, and natural windows (sunset/sunrise).
   */
  calculateVisitDuration(params: VisitCalculationParams): number {
    const minMins = Math.max(15, params.minimumVisitMinutes);
    const recMins = Math.max(minMins, params.recommendedVisitMinutes);
    const maxMins = Math.max(recMins, params.maximumVisitMinutes);
    const tier = params.durationTier || "Normal";

    // 1. Baseline duration from DurationTier
    let duration: number;
    switch (tier) {
      case "Quick":
        duration = Math.round(minMins + (recMins - minMins) * 0.25);
        break;
      case "Relaxed":
        duration = Math.round(recMins + (maxMins - recMins) * 0.65);
        break;
      case "Normal":
      default:
        duration = recMins;
        break;
    }

    // 2. Adjust for Traveller Type
    const travellerType = params.travellerType || "couple";
    switch (travellerType) {
      case "family":
        duration = Math.round(duration * 1.2); // +20% for kids/multi-gen pace
        break;
      case "friends":
        duration = Math.round(duration * 1.08); // +8% for group movement
        break;
      case "solo":
        duration = Math.round(duration * 0.9); // -10% agile solo pace
        break;
      case "business":
        duration = Math.round(duration * 0.8); // -20% focused brisk visit
        break;
    }

    // 3. Adjust for Travel Pace
    const pace = params.travelPace || "moderate";
    switch (pace) {
      case "relaxed":
        duration = Math.round(duration * 1.15); // +15% leisurely exploration
        break;
      case "fast-paced":
        duration = Math.round(duration * 0.85); // -15% highlight-focused
        break;
    }

    // 4. Adjust for Weather (e.g. Rain on outdoor sights cuts duration)
    if (
      params.weatherCondition &&
      (params.weatherCondition.toLowerCase().includes("rain") ||
        params.weatherCondition.toLowerCase().includes("storm"))
    ) {
      duration = Math.round(duration * 0.75);
    }

    // 5. Sunset / Sunrise viewpoints require sufficient photography buffer
    if (params.isSunsetOrSunriseViewpoint) {
      duration = Math.max(duration, 50); // Minimum 50 mins for twilight progression
    }

    // 6. Clamp strictly between minimum and maximum bounds
    duration = Math.max(minMins, Math.min(maxMins, duration));

    // 7. Respect remaining daytime hours if constrained
    if (
      params.remainingDayMinutes !== undefined &&
      params.remainingDayMinutes > 0 &&
      duration > params.remainingDayMinutes
    ) {
      duration = Math.max(minMins, params.remainingDayMinutes);
    }

    return duration;
  }

  /**
   * 2. calculateTravelDuration
   * Calculates realistic transit minutes between two geographic coordinates.
   */
  calculateTravelDuration(
    origin: ItemLocation,
    destination: ItemLocation,
    mode: "driving" | "walking" | "cycling" = "driving"
  ): number {
    if (
      origin.latitude === destination.latitude &&
      origin.longitude === destination.longitude
    ) {
      return 0; // Same location (e.g. adjacent sights or hotel drop-off)
    }

    // Haversine great-circle distance
    const R = 6371; // Earth radius in km
    const dLat = (destination.latitude - origin.latitude) * (Math.PI / 180);
    const dLon = (destination.longitude - origin.longitude) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(origin.latitude * (Math.PI / 180)) *
        Math.cos(destination.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Realistic urban average speeds accounting for traffic & signals
    let speedKmh: number;
    switch (mode) {
      case "walking":
        speedKmh = 4.5;
        break;
      case "cycling":
        speedKmh = 14.0;
        break;
      case "driving":
      default:
        // Road detour factor: Urban roads are ~1.35x longer than straight lines
        speedKmh = 32.0; // 32 km/h average in Indian cities with traffic
        break;
    }

    const roadDetourFactor = mode === "walking" ? 1.2 : 1.35;
    const effectiveKm = distanceKm * roadDetourFactor;
    const travelHours = effectiveKm / speedKmh;
    const travelMinutes = Math.ceil(travelHours * 60);

    // Minimum 3 minutes for any vehicle start/stop or neighborhood hop
    return Math.max(3, travelMinutes);
  }

  /**
   * 3. calculateWaitingTime
   * Determines ticket line / security screening wait based on peak hours.
   */
  calculateWaitingTime(
    attraction: {
      peak_start?: string;
      peak_end?: string;
      estimated_queue_minutes?: number;
    },
    arrivalTimeStr: string
  ): number {
    const baseQueue = attraction.estimated_queue_minutes ?? 10;
    if (baseQueue <= 0) return 0;

    const arrivalMins = timeToMinutes(arrivalTimeStr);
    const peakStartMins = attraction.peak_start
      ? timeToMinutes(attraction.peak_start)
      : 11 * 60; // Default peak 11:00 AM
    const peakEndMins = attraction.peak_end
      ? timeToMinutes(attraction.peak_end)
      : 15 * 60; // Default peak 03:00 PM

    const isPeak = arrivalMins >= peakStartMins && arrivalMins <= peakEndMins;

    if (isPeak) {
      // Arriving during peak congestion: full queue or surge
      return Math.round(baseQueue * 1.3);
    } else {
      // Off-peak: fast-moving lines
      return Math.max(3, Math.round(baseQueue * 0.4));
    }
  }

  /**
   * 4. calculateBuffer
   * Computes contingency margin to absorb traffic jams, delays, and transitions.
   */
  calculateBuffer(
    travelMinutes: number,
    visitMinutes: number,
    travelPace: "relaxed" | "moderate" | "fast-paced" = "moderate",
    travellerType: string = "couple"
  ): number {
    // 15% of transit + 5% of visit + 5 min transition
    let buffer = Math.round(travelMinutes * 0.15 + visitMinutes * 0.05 + 5);

    if (travelPace === "relaxed" || travellerType === "family") {
      buffer += 10; // Extra breathing room for families / leisure
    } else if (travelPace === "fast-paced" || travellerType === "solo") {
      buffer = Math.max(5, buffer - 5); // Tighter turnarounds
    }

    return Math.max(5, buffer);
  }

  /**
   * 5. calculateDailyAvailableTime
   * Determines net free time within a day after accounting for meals and rest.
   */
  calculateDailyAvailableTime(
    dayStart: string = "08:30",
    dayEnd: string = "21:00",
    mealMinutes: number = 135, // Lunch (60m) + Dinner (75m)
    restMinutes: number = 45   // Afternoon downtime
  ): {
    totalWakingMinutes: number;
    allocatedLivingMinutes: number;
    availableSightseeingMinutes: number;
  } {
    const startMins = timeToMinutes(dayStart);
    const endMins = timeToMinutes(dayEnd);
    const totalWaking = Math.max(0, endMins - startMins);
    const allocatedLiving = mealMinutes + restMinutes;
    const available = Math.max(0, totalWaking - allocatedLiving);

    return {
      totalWakingMinutes: totalWaking,
      allocatedLivingMinutes: allocatedLiving,
      availableSightseeingMinutes: available,
    };
  }

  /**
   * 6. validateDailySchedule
   * Verifies schedule feasibility against opening hours, transit physics,
   * overlaps, and exhaustion limits. Returns errors and structured alternatives.
   */
  validateDailySchedule(
    items: ItineraryItem[],
    dayWindow: { start: string; end: string } = { start: "08:30", end: "21:00" }
  ): ScheduleValidationResult {
    const errors: ScheduleValidationError[] = [];
    const warnings: ScheduleValidationError[] = [];

    const dayStartMins = timeToMinutes(dayWindow.start);
    const dayEndMins = timeToMinutes(dayWindow.end);
    const dayCapacity = dayEndMins - dayStartMins;

    // Sort items chronologically by start_time
    const sorted = [...items].sort(
      (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
    );

    // Rule 1: Validate individual attraction opening / closing hours & minimum duration
    for (const item of sorted) {
      const itemStart = timeToMinutes(item.start_time);
      const itemEnd = timeToMinutes(item.end_time);

      // Check Opening Hours
      if (item.opening_time && item.closing_time) {
        const openMins = timeToMinutes(item.opening_time);
        const closeMins = timeToMinutes(item.closing_time);

        if (itemStart < openMins) {
          errors.push({
            id: `err-closed-early-${item.id}`,
            type: "attraction_closed",
            severity: "error",
            message: `${item.title} opens at ${item.opening_time}, but is scheduled at ${item.start_time}.`,
            itemIds: [item.id],
            suggestedFix: `Shift start time to ${item.opening_time} or later.`,
            alternative: {
              actionType: "shift_time",
              description: `Reschedule ${item.title} to start at ${item.opening_time}.`,
            },
          });
        }

        if (itemEnd > closeMins) {
          errors.push({
            id: `err-closed-late-${item.id}`,
            type: "attraction_closed",
            severity: "error",
            message: `${item.title} closes at ${item.closing_time}, but visit extends until ${item.end_time}.`,
            itemIds: [item.id],
            suggestedFix: `Arrive earlier or reduce visit duration so it completes by ${item.closing_time}.`,
            alternative: {
              actionType: "switch_tier",
              description: `Switch ${item.title} to Quick visit duration to finish before closing.`,
            },
          });
        }
      }

      // Check Insufficient Visit Time (< 15 mins for major sight)
      if (
        (item.category === "sightseeing" || item.category === "activity") &&
        item.visit_minutes < 15
      ) {
        errors.push({
          id: `err-insufficient-${item.id}`,
          type: "insufficient_time",
          severity: "error",
          message: `${item.title} has only ${item.visit_minutes} minutes visit time, which is insufficient for meaningful exploration.`,
          itemIds: [item.id],
          suggestedFix: `Allocate at least 30 minutes for ${item.title}.`,
          alternative: {
            actionType: "switch_tier",
            description: `Extend visit to at least 30 minutes.`,
          },
        });
      }
    }

    // Rule 2 & 3: Check overlaps and impossible transit between consecutive items
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      const currentEndMins = timeToMinutes(current.end_time);
      const nextStartMins = timeToMinutes(next.start_time);

      // Overlap detection
      if (nextStartMins < currentEndMins) {
        const overlapMins = currentEndMins - nextStartMins;
        errors.push({
          id: `err-overlap-${current.id}-${next.id}`,
          type: "overlapping_activities",
          severity: "error",
          message: `Overlapping schedule: ${current.title} ends at ${current.end_time}, but ${next.title} starts at ${next.start_time} (${overlapMins}m overlap).`,
          itemIds: [current.id, next.id],
          suggestedFix: `Delay ${next.title} to start after ${current.end_time}.`,
          alternative: {
            actionType: "reorder",
            description: `Reschedule ${next.title} start time to ${minutesToTime(currentEndMins + (next.travel_minutes || 10))}.`,
          },
        });
      } else {
        // Gap exists: verify if gap accommodates required transit
        const gapMins = nextStartMins - currentEndMins;
        const requiredTransit = next.travel_minutes;

        if (requiredTransit > 0 && gapMins < requiredTransit) {
          errors.push({
            id: `err-impossible-travel-${current.id}-${next.id}`,
            type: "impossible_travel",
            severity: "error",
            message: `Impossible transit: Travel from ${current.title} to ${next.title} takes ${requiredTransit} minutes, but only ${gapMins} minutes is allocated.`,
            itemIds: [current.id, next.id],
            suggestedFix: `Increase gap between items to at least ${requiredTransit} minutes.`,
            alternative: {
              actionType: "shift_time",
              description: `Shift ${next.title} start time forward by ${requiredTransit - gapMins} minutes.`,
            },
          });
        }
      }
    }

    // Rule 4: Excessive Daily Schedule & Fatigue
    const allocation = this.calculateTotalTimeAllocation(items, dayWindow);

    if (allocation.totalAllocatedMinutes > dayCapacity) {
      const excess = allocation.totalAllocatedMinutes - dayCapacity;
      errors.push({
        id: "err-excessive-day",
        type: "excessive_daily_schedule",
        severity: "error",
        message: `Daily schedule exceeds waking day capacity by ${excess} minutes (${Math.round((excess / 60) * 10) / 10}h).`,
        itemIds: items.map((i) => i.id),
        suggestedFix: `Move lower-priority attractions to the next day or switch items to Quick duration tier.`,
        alternative: {
          actionType: "move_day",
          description: `Move lowest-priority item to next itinerary day.`,
        },
      });
    } else if (
      allocation.sightseeingMinutes + allocation.travelMinutes > 540 &&
      allocation.restMinutes < 30
    ) {
      // Over 9 hours of sightseeing & transit without at least 30m rest
      warnings.push({
        id: "warn-fatigue",
        type: "excessive_daily_schedule",
        severity: "warning",
        message: `High traveler fatigue risk: Schedule has over 9 hours of walking and transit with less than 30 minutes of dedicated rest.`,
        itemIds: items.map((i) => i.id),
        suggestedFix: `Insert an afternoon tea or café rest block between 03:00 PM and 04:30 PM.`,
        alternative: {
          actionType: "insert_rest",
          description: `Insert a 45-minute rest block.`,
        },
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      allocation,
    };
  }

  /**
   * 7. calculateTotalTimeAllocation
   * Breaks down daily time strictly into travel, sightseeing, food, rest,
   * waiting, buffer, and remaining available time.
   */
  calculateTotalTimeAllocation(
    items: ItineraryItem[],
    dayWindow: { start: string; end: string } = { start: "08:30", end: "21:00" }
  ): DailyTimeAllocation {
    const dayStartMins = timeToMinutes(dayWindow.start);
    const dayEndMins = timeToMinutes(dayWindow.end);
    const dayCapacityMinutes = Math.max(0, dayEndMins - dayStartMins);

    let travelMinutes = 0;
    let sightseeingMinutes = 0;
    let foodMinutes = 0;
    let restMinutes = 0;
    let waitingMinutes = 0;
    let bufferMinutes = 0;

    for (const item of items) {
      travelMinutes += item.travel_minutes || 0;
      waitingMinutes += item.waiting_minutes || 0;
      bufferMinutes += item.buffer_minutes || 0;

      switch (item.category) {
        case "food":
          foodMinutes += item.visit_minutes || 0;
          break;
        case "rest":
          restMinutes += item.visit_minutes || 0;
          break;
        case "sightseeing":
        case "activity":
        default:
          sightseeingMinutes += item.visit_minutes || 0;
          break;
      }
    }

    const totalAllocatedMinutes =
      travelMinutes +
      sightseeingMinutes +
      foodMinutes +
      restMinutes +
      waitingMinutes +
      bufferMinutes;

    const availableMinutes = Math.max(
      0,
      dayCapacityMinutes - totalAllocatedMinutes
    );

    return {
      availableMinutes,
      travelMinutes,
      sightseeingMinutes,
      foodMinutes,
      restMinutes,
      waitingMinutes,
      bufferMinutes,
      totalAllocatedMinutes,
      dayCapacityMinutes,
    };
  }

  /**
   * "Optimize Day" Algorithm
   * Eliminates overlaps, resolves opening hour conflicts, inserts required travel
   * and queues, reorders geographically to minimize travel, and adds meal/rest blocks.
   */
  optimizeDaySchedule(
    items: ItineraryItem[],
    dayWindow: { start: string; end: string } = { start: "08:30", end: "21:00" }
  ): {
    optimizedItems: ItineraryItem[];
    changesMade: string[];
    validation: ScheduleValidationResult;
  } {
    if (items.length === 0) {
      return {
        optimizedItems: [],
        changesMade: ["No items to optimize."],
        validation: this.validateDailySchedule([], dayWindow),
      };
    }

    const changesMade: string[] = [];
    const dayStartMins = timeToMinutes(dayWindow.start);

    // 1. Separate fixed-schedule items (e.g. booked dinner, hotel check-in) from flexible sights
    const sightsAndActivities = items.filter(
      (it) => it.category === "sightseeing" || it.category === "activity"
    );
    const mealsAndRest = items.filter(
      (it) => it.category === "food" || it.category === "rest"
    );

    // 2. Greedy nearest-neighbor route sort for sights starting from first item location
    const sortedSights: ItineraryItem[] = [];
    const remaining = [...sightsAndActivities];

    if (remaining.length > 0) {
      // Pick first item as anchor
      let current = remaining.shift()!;
      sortedSights.push(current);

      while (remaining.length > 0) {
        let bestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < remaining.length; i++) {
          const candidate = remaining[i];
          const dist = this.calculateTravelDuration(
            current.location,
            candidate.location
          );
          if (dist < minDistance) {
            minDistance = dist;
            bestIndex = i;
          }
        }

        current = remaining.splice(bestIndex, 1)[0];
        sortedSights.push(current);
      }

      if (sightsAndActivities.length > 1) {
        changesMade.push(
          "Reordered sights by geographic proximity to minimize cross-city transit."
        );
      }
    }

    // 3. Sequentially lay out schedule starting at day start
    let cursorMins = dayStartMins;
    const reconstructed: ItineraryItem[] = [];
    let prevLocation: ItemLocation | null = null;
    let lunchInserted = false;

    for (let i = 0; i < sortedSights.length; i++) {
      const sight = sortedSights[i];

      // Check if lunch should be inserted (around 13:00 / 780m)
      if (!lunchInserted && cursorMins >= 12 * 60 + 30) {
        const lunchStart = cursorMins;
        const lunchDuration = 60;
        const lunchEnd = lunchStart + lunchDuration;

        reconstructed.push({
          id: `item-lunch-auto-${Date.now()}`,
          itinerary_id: sight.itinerary_id,
          trip_id: sight.trip_id,
          title: "Lunch Break & Regional Cuisine",
          category: "food",
          date: sight.date,
          start_time: minutesToTime(lunchStart),
          end_time: minutesToTime(lunchEnd),
          location: sight.location,
          visit_minutes: lunchDuration,
          travel_minutes: 0,
          waiting_minutes: 0,
          buffer_minutes: 10,
          estimated_cost: 400,
          priority: "high",
          status: "scheduled",
          duration_tier: "Normal",
          sort_order: reconstructed.length,
        });

        cursorMins = lunchEnd + 10; // plus buffer
        lunchInserted = true;
        changesMade.push("Scheduled 60-minute regional lunch block.");
      }

      // Compute travel time from previous location
      let travelMins = 0;
      if (prevLocation) {
        travelMins = this.calculateTravelDuration(prevLocation, sight.location);
      }

      // Compute arrival time after transit
      let arrivalMins = cursorMins + travelMins;

      // Opening hours check: if sight not yet open, wait until opening
      if (sight.opening_time) {
        const openMins = timeToMinutes(sight.opening_time);
        if (arrivalMins < openMins) {
          const shiftWait = openMins - arrivalMins;
          arrivalMins = openMins;
          changesMade.push(
            `Adjusted ${sight.title} arrival to ${sight.opening_time} to match opening hours.`
          );
        }
      }

      // Compute queue & buffer
      const waitMins = this.calculateWaitingTime(
        {
          estimated_queue_minutes: sight.waiting_minutes || 10,
        },
        minutesToTime(arrivalMins)
      );

      const visitMins = sight.visit_minutes || 60;
      const bufferMins = this.calculateBuffer(travelMins, visitMins);

      const startMins = arrivalMins + waitMins;
      const endMins = startMins + visitMins;

      reconstructed.push({
        ...sight,
        start_time: minutesToTime(startMins),
        end_time: minutesToTime(endMins),
        travel_minutes: travelMins,
        waiting_minutes: waitMins,
        buffer_minutes: bufferMins,
        sort_order: reconstructed.length,
      });

      cursorMins = endMins + bufferMins;
      prevLocation = sight.location;
    }

    // 4. Validate the reconstructed schedule
    const validation = this.validateDailySchedule(reconstructed, dayWindow);

    return {
      optimizedItems: reconstructed,
      changesMade,
      validation,
    };
  }
}

// Default singleton instance
export const timeEngine = new TimeEngine();
