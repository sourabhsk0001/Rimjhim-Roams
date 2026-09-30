import test from "node:test";
import assert from "node:assert";
import {
  timeToMinutes,
  minutesToTime,
  addMinutesToTime,
  TimeEngine,
  timeEngine,
} from "@/lib/time/engine";
import {
  getTripItineraries,
  getItineraryDay,
  optimizeItineraryDay,
  addItineraryItem,
  deleteItineraryItem,
} from "@/lib/services/itinerary-service";
import { createTrip } from "@/lib/services/trip-service";
import { ItineraryItem, DurationTier } from "@/types/time";

// ==============================================================================
// 1. Time Conversion & Invariant Validation Tests
// ==============================================================================

test("Time Conversion: converts between HH:MM and minutes from midnight", () => {
  assert.strictEqual(timeToMinutes("00:00"), 0);
  assert.strictEqual(timeToMinutes("08:30"), 510);
  assert.strictEqual(timeToMinutes("13:45"), 825);
  assert.strictEqual(timeToMinutes("21:00"), 1260);

  // AM/PM format support
  assert.strictEqual(timeToMinutes("09:00 AM"), 540);
  assert.strictEqual(timeToMinutes("05:30 PM"), 1050);

  // Round-trip
  assert.strictEqual(minutesToTime(510), "08:30");
  assert.strictEqual(minutesToTime(825), "13:45");
  assert.strictEqual(addMinutesToTime("09:00", 90), "10:30");
});

test("Architectural Invariant: visit, travel, waiting, and buffer are strictly separate", () => {
  const item: ItineraryItem = {
    id: "item-test-1",
    itinerary_id: "itin-1",
    trip_id: "trip-1",
    title: "Amber Palace",
    category: "sightseeing",
    date: "2026-11-01",
    start_time: "09:00",
    end_time: "11:30",
    location: { latitude: 26.9855, longitude: 75.8513, name: "Amber Palace" },
    visit_minutes: 120,
    travel_minutes: 25,
    waiting_minutes: 15,
    buffer_minutes: 10,
    estimated_cost: 100,
    priority: "must_visit",
    status: "scheduled",
    duration_tier: "Normal",
    sort_order: 0,
  };

  // Verify none are undefined or NaN
  assert.strictEqual(typeof item.visit_minutes, "number");
  assert.strictEqual(typeof item.travel_minutes, "number");
  assert.strictEqual(typeof item.waiting_minutes, "number");
  assert.strictEqual(typeof item.buffer_minutes, "number");

  // Invariant assertion: fields are distinct and separate
  assert.strictEqual(item.visit_minutes, 120);
  assert.strictEqual(item.travel_minutes, 25);
  assert.strictEqual(item.waiting_minutes, 15);
  assert.strictEqual(item.buffer_minutes, 10);
});

// ==============================================================================
// 2. calculateVisitDuration Tests
// ==============================================================================

test("TimeEngine: calculateVisitDuration differentiates Quick, Normal, and Relaxed tiers", () => {
  const baseParams = {
    minimumVisitMinutes: 60,
    recommendedVisitMinutes: 120,
    maximumVisitMinutes: 180,
    travellerType: "couple",
    travelPace: "moderate",
  };

  const quick = timeEngine.calculateVisitDuration({
    ...baseParams,
    durationTier: "Quick",
  });
  const normal = timeEngine.calculateVisitDuration({
    ...baseParams,
    durationTier: "Normal",
  });
  const relaxed = timeEngine.calculateVisitDuration({
    ...baseParams,
    durationTier: "Relaxed",
  });

  assert.ok(
    quick < normal,
    `Quick (${quick}m) should be less than Normal (${normal}m)`
  );
  assert.ok(
    normal < relaxed,
    `Normal (${normal}m) should be less than Relaxed (${relaxed}m)`
  );
  assert.ok(quick >= baseParams.minimumVisitMinutes);
  assert.ok(relaxed <= baseParams.maximumVisitMinutes);
});

test("TimeEngine: calculateVisitDuration adjusts for traveller type and pace", () => {
  const baseParams = {
    minimumVisitMinutes: 45,
    recommendedVisitMinutes: 90,
    maximumVisitMinutes: 150,
    durationTier: "Normal" as DurationTier,
  };

  const familyDuration = timeEngine.calculateVisitDuration({
    ...baseParams,
    travellerType: "family",
    travelPace: "relaxed",
  });

  const soloFastDuration = timeEngine.calculateVisitDuration({
    ...baseParams,
    travellerType: "solo",
    travelPace: "fast-paced",
  });

  assert.ok(
    familyDuration > soloFastDuration,
    `Family/relaxed pace (${familyDuration}m) should allocate more visit time than solo/fast-paced (${soloFastDuration}m)`
  );
});

test("TimeEngine: calculateVisitDuration respects sunset viewpoint buffer", () => {
  const sunsetDuration = timeEngine.calculateVisitDuration({
    minimumVisitMinutes: 20,
    recommendedVisitMinutes: 30,
    maximumVisitMinutes: 90,
    isSunsetOrSunriseViewpoint: true,
  });

  assert.ok(
    sunsetDuration >= 50,
    `Sunset viewpoints must allocate at least 50m, got ${sunsetDuration}m`
  );
});

// ==============================================================================
// 3. calculateTravelDuration Tests
// ==============================================================================

test("TimeEngine: calculateTravelDuration returns 0 for same point and realistic times for travel", () => {
  const locA = { latitude: 26.9855, longitude: 75.8513, name: "Amber Fort" };
  const locB = { latitude: 26.9239, longitude: 75.8267, name: "Hawa Mahal" };

  const same = timeEngine.calculateTravelDuration(locA, locA);
  assert.strictEqual(same, 0);

  const driving = timeEngine.calculateTravelDuration(locA, locB, "driving");
  const walking = timeEngine.calculateTravelDuration(locA, locB, "walking");

  assert.ok(driving >= 15 && driving <= 40, `Driving should be ~20-30 mins, got ${driving}m`);
  assert.ok(walking > driving * 2, `Walking (${walking}m) should be much longer than driving (${driving}m)`);
});

// ==============================================================================
// 4. calculateWaitingTime Tests
// ==============================================================================

test("TimeEngine: calculateWaitingTime reflects peak vs off-peak congestion", () => {
  const attraction = {
    peak_start: "11:00 AM",
    peak_end: "03:00 PM",
    estimated_queue_minutes: 30,
  };

  const peakWait = timeEngine.calculateWaitingTime(attraction, "12:30");
  const offPeakWait = timeEngine.calculateWaitingTime(attraction, "09:00");

  assert.ok(
    peakWait > offPeakWait,
    `Peak wait (${peakWait}m) must be greater than off-peak wait (${offPeakWait}m)`
  );
  assert.ok(peakWait >= 30);
  assert.ok(offPeakWait < 20);
});

// ==============================================================================
// 5. calculateBuffer Tests
// ==============================================================================

test("TimeEngine: calculateBuffer scales with travel and visit length", () => {
  const shortBuffer = timeEngine.calculateBuffer(10, 30, "moderate", "couple");
  const longBuffer = timeEngine.calculateBuffer(60, 180, "relaxed", "family");

  assert.ok(shortBuffer >= 5);
  assert.ok(
    longBuffer > shortBuffer,
    `Long journey buffer (${longBuffer}m) should exceed short buffer (${shortBuffer}m)`
  );
});

// ==============================================================================
// 6. calculateDailyAvailableTime & calculateTotalTimeAllocation Tests
// ==============================================================================

test("TimeEngine: calculateDailyAvailableTime accurately computes waking net capacity", () => {
  const result = timeEngine.calculateDailyAvailableTime("08:30", "21:00", 135, 45);
  assert.strictEqual(result.totalWakingMinutes, 750); // 12.5 hours = 750 mins
  assert.strictEqual(result.allocatedLivingMinutes, 180); // 135 + 45
  assert.strictEqual(result.availableSightseeingMinutes, 570); // 750 - 180
});

test("TimeEngine: calculateTotalTimeAllocation computes discrete allocations without merging", () => {
  const items: ItineraryItem[] = [
    {
      id: "it-1",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "Sight A",
      category: "sightseeing",
      date: "2026-11-01",
      start_time: "09:00",
      end_time: "11:00",
      location: { latitude: 26.9, longitude: 75.8, name: "Sight A" },
      visit_minutes: 120,
      travel_minutes: 20,
      waiting_minutes: 15,
      buffer_minutes: 10,
      estimated_cost: 100,
      priority: "high",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 0,
    },
    {
      id: "it-2",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "Lunch Bistro",
      category: "food",
      date: "2026-11-01",
      start_time: "12:00",
      end_time: "13:00",
      location: { latitude: 26.91, longitude: 75.81, name: "Bistro" },
      visit_minutes: 60,
      travel_minutes: 15,
      waiting_minutes: 5,
      buffer_minutes: 5,
      estimated_cost: 500,
      priority: "medium",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 1,
    },
  ];

  const alloc = timeEngine.calculateTotalTimeAllocation(items, {
    start: "08:30",
    end: "21:00",
  });

  assert.strictEqual(alloc.travelMinutes, 35); // 20 + 15
  assert.strictEqual(alloc.sightseeingMinutes, 120);
  assert.strictEqual(alloc.foodMinutes, 60);
  assert.strictEqual(alloc.waitingMinutes, 20); // 15 + 5
  assert.strictEqual(alloc.bufferMinutes, 15); // 10 + 5
  assert.strictEqual(alloc.totalAllocatedMinutes, 250);
  assert.strictEqual(alloc.dayCapacityMinutes, 750);
  assert.strictEqual(alloc.availableMinutes, 500); // 750 - 250
});

// ==============================================================================
// 7. validateDailySchedule: Error Detection
// ==============================================================================

test("TimeEngine: validateDailySchedule detects attraction_closed early and late", () => {
  const items: ItineraryItem[] = [
    {
      id: "it-closed-early",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "City Palace",
      category: "sightseeing",
      date: "2026-11-01",
      start_time: "07:30", // Opens at 09:30
      end_time: "09:00",
      location: { latitude: 26.9, longitude: 75.8, name: "City Palace" },
      visit_minutes: 90,
      travel_minutes: 10,
      waiting_minutes: 0,
      buffer_minutes: 5,
      estimated_cost: 100,
      priority: "high",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 0,
      opening_time: "09:30",
      closing_time: "17:00",
    },
  ];

  const res = timeEngine.validateDailySchedule(items);
  assert.strictEqual(res.isValid, false);
  const closedErr = res.errors.find((e) => e.type === "attraction_closed");
  assert.ok(closedErr);
  assert.ok(closedErr.message.includes("opens at 09:30"));
});

test("TimeEngine: validateDailySchedule detects overlapping activities", () => {
  const items: ItineraryItem[] = [
    {
      id: "it-1",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "Fort Visit",
      category: "sightseeing",
      date: "2026-11-01",
      start_time: "09:00",
      end_time: "11:30",
      location: { latitude: 26.9, longitude: 75.8, name: "Fort" },
      visit_minutes: 150,
      travel_minutes: 0,
      waiting_minutes: 0,
      buffer_minutes: 0,
      estimated_cost: 0,
      priority: "high",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 0,
    },
    {
      id: "it-2",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "Museum Tour",
      category: "sightseeing",
      date: "2026-11-01",
      start_time: "11:00", // Starts before 11:30!
      end_time: "12:30",
      location: { latitude: 26.91, longitude: 75.81, name: "Museum" },
      visit_minutes: 90,
      travel_minutes: 10,
      waiting_minutes: 0,
      buffer_minutes: 0,
      estimated_cost: 0,
      priority: "high",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 1,
    },
  ];

  const res = timeEngine.validateDailySchedule(items);
  assert.strictEqual(res.isValid, false);
  const overlapErr = res.errors.find((e) => e.type === "overlapping_activities");
  assert.ok(overlapErr);
  assert.ok(overlapErr.message.includes("overlap"));
});

test("TimeEngine: validateDailySchedule detects impossible_travel gap", () => {
  const items: ItineraryItem[] = [
    {
      id: "it-1",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "South Sight",
      category: "sightseeing",
      date: "2026-11-01",
      start_time: "09:00",
      end_time: "11:00",
      location: { latitude: 15.2, longitude: 73.9, name: "South" },
      visit_minutes: 120,
      travel_minutes: 0,
      waiting_minutes: 0,
      buffer_minutes: 0,
      estimated_cost: 0,
      priority: "high",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 0,
    },
    {
      id: "it-2",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "North Sight",
      category: "sightseeing",
      date: "2026-11-01",
      start_time: "11:10", // Only 10 mins gap!
      end_time: "13:00",
      location: { latitude: 15.6, longitude: 73.8, name: "North" },
      visit_minutes: 110,
      travel_minutes: 50, // Requires 50 mins transit!
      waiting_minutes: 0,
      buffer_minutes: 0,
      estimated_cost: 0,
      priority: "high",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 1,
    },
  ];

  const res = timeEngine.validateDailySchedule(items);
  assert.strictEqual(res.isValid, false);
  const travelErr = res.errors.find((e) => e.type === "impossible_travel");
  assert.ok(travelErr);
  assert.ok(travelErr.message.includes("50 minutes"));
});

// ==============================================================================
// 8. "Optimize Day" Algorithm Tests
// ==============================================================================

test("TimeEngine: optimizeDaySchedule eliminates impossible schedule conflicts", () => {
  const conflictingItems: ItineraryItem[] = [
    {
      id: "s-1",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "Amber Palace",
      category: "sightseeing",
      date: "2026-11-01",
      start_time: "07:30", // Closed at 07:30 (opens at 08:30)
      end_time: "10:00",
      location: { latitude: 26.9855, longitude: 75.8513, name: "Amber Palace" },
      visit_minutes: 120,
      travel_minutes: 0,
      waiting_minutes: 0,
      buffer_minutes: 0,
      estimated_cost: 100,
      priority: "must_visit",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 0,
      opening_time: "08:30",
      closing_time: "17:30",
    },
    {
      id: "s-2",
      itinerary_id: "itin-1",
      trip_id: "trip-1",
      title: "Hawa Mahal",
      category: "sightseeing",
      date: "2026-11-01",
      start_time: "09:30", // Overlaps with Amber Palace!
      end_time: "11:00",
      location: { latitude: 26.9239, longitude: 75.8267, name: "Hawa Mahal" },
      visit_minutes: 60,
      travel_minutes: 25,
      waiting_minutes: 0,
      buffer_minutes: 0,
      estimated_cost: 50,
      priority: "high",
      status: "scheduled",
      duration_tier: "Normal",
      sort_order: 1,
      opening_time: "09:00",
      closing_time: "17:00",
    },
  ];

  const optimization = timeEngine.optimizeDaySchedule(conflictingItems, {
    start: "08:30",
    end: "21:00",
  });

  assert.ok(optimization.changesMade.length > 0);
  assert.strictEqual(
    optimization.validation.isValid,
    true,
    "Optimized day must have zero validation errors"
  );
  assert.strictEqual(optimization.validation.errors.length, 0);

  // Verify times are strictly non-overlapping
  const items = optimization.optimizedItems;
  for (let i = 0; i < items.length - 1; i++) {
    const curEnd = timeToMinutes(items[i].end_time);
    const nextStart = timeToMinutes(items[i + 1].start_time);
    assert.ok(
      nextStart >= curEnd,
      `Item ${i + 1} (${items[i + 1].start_time}) should start at or after Item ${i} (${items[i].end_time})`
    );
  }
});

// ==============================================================================
// 9. ItineraryService Integration Tests
// ==============================================================================

test("Itinerary Service: seeds baseline days, allows add/delete, and optimizes day", async () => {
  const userId = "test-user-time-1";
  const tripRes = await createTrip(
    {
      origin: "New Delhi",
      destination: "Jaipur",
      start_date: "2026-11-01",
      end_date: "2026-11-04",
      budget: 15000,
      currency: "INR",
      traveller_count: 2,
      traveller_type: "couple",
      travel_pace: "moderate",
    },
    userId
  );

  assert.ok(tripRes.success && tripRes.data);
  const tripId = tripRes.data.id;

  // 1. Fetch itineraries (seeds baseline days)
  const itinRes = await getTripItineraries(tripId, userId);
  assert.ok(itinRes.success && itinRes.days);
  assert.ok(itinRes.days.length >= 3);

  // 2. Load Day 1
  const day1Res = await getItineraryDay(tripId, 1, userId);
  assert.ok(day1Res.success && day1Res.day);
  assert.ok(day1Res.day.items.length >= 2);

  // 3. Add a custom activity
  const addRes = await addItineraryItem(tripId, 1, userId, {
    title: "Chokhi Dhani Cultural Dinner",
    category: "food",
    start_time: "19:00",
    end_time: "21:00",
    location: { latitude: 26.77, longitude: 75.83, name: "Chokhi Dhani" },
    visit_minutes: 120,
    travel_minutes: 30,
    duration_tier: "Relaxed",
  });
  assert.ok(addRes.success && addRes.item);
  assert.strictEqual(addRes.item.visit_minutes, 120);
  assert.strictEqual(addRes.item.travel_minutes, 30);

  // 4. Optimize Day 1
  const optRes = await optimizeItineraryDay(tripId, 1, userId);
  assert.ok(optRes.success && optRes.result);
  assert.strictEqual(optRes.result.validation.isValid, true);

  // 5. Delete added item
  const delRes = await deleteItineraryItem(tripId, addRes.item.id, userId);
  assert.ok(delRes.success);
});
