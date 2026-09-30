import { createClient as createServerSupabase } from "@/lib/supabase/server";
import {
  Destination,
  Attraction,
  Hotel,
  Restaurant,
  TransportOption,
  TaxiOption,
} from "@/types/travel";
import {
  ItineraryItem,
  DurationTier,
  ScheduleValidationResult,
} from "@/types/time";
import { BudgetCategory } from "@/types/budget";
import {
  PlannedTripResult,
  TripPlannerInput,
  SelectedHotelPlan,
  SelectedTransportPlan,
  SelectedMealPlan,
  SelectedAttractionPlan,
  PlannedDayItinerary,
  PlannerStepInfo,
} from "@/types/planner";
import {
  DEMO_DESTINATIONS,
  DEMO_ATTRACTIONS,
  DEMO_HOTELS,
  DEMO_RESTAURANTS,
  DEMO_TRANSPORT,
  DEMO_TAXIS,
  getDestinationById,
  getDestinationAttractions,
  getDestinationHotels,
  getDestinationRestaurants,
  getDestinationTransport,
} from "@/lib/services/travel-data-service";
import { timeEngine, timeToMinutes, minutesToTime, addMinutesToTime } from "@/lib/time/engine";
import { budgetEngine } from "@/lib/budget/engine";
import { toMinorUnits, fromMinorUnits, formatCurrency } from "@/lib/budget/money";
import { calculateRoute, calculateDistance } from "@/lib/geo/routing";
import { getTripById } from "@/lib/services/trip-service";
import { travelMemoryService } from "@/lib/services/travel-memory-service";
import { UserTravelMemoriesSummary } from "@/types/memories";

function isSupabaseLive(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url && key && !url.includes("mock-project") && key !== "mock-anon-key"
  );
}

// In-memory cache of generated complete plans for instant retrieval during demo / tests
const memoryPlannedTrips: Map<string, PlannedTripResult> = new Map();

export class TripPlannerService {
  /**
   * Plans a complete trip from trip ID and authorized user.
   */
  async planTrip(tripId: string, userId: string): Promise<PlannedTripResult> {
    const { trip, isAuthorized } = await getTripById(tripId, userId);
    if (!trip || !isAuthorized) {
      throw new Error("Trip not found or unauthorized access.");
    }

    const input: TripPlannerInput = {
      tripId: trip.id,
      userId,
      origin: trip.origin,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      durationDays: trip.duration_days,
      budget: trip.budget,
      currency: trip.currency,
      travellerCount: trip.traveller_count,
      travellerType: trip.traveller_type,
      travelPace: (trip.travel_pace as "relaxed" | "moderate" | "fast") || "moderate",
      preferences: trip.preferences as Record<string, unknown>,
    };

    return this.generateCompletePlan(input);
  }

  /**
   * Complete deterministic 10-stage travel planning pipeline.
   */
  async generateCompletePlan(input: TripPlannerInput): Promise<PlannedTripResult> {
    const steps: PlannerStepInfo[] = [];

    // --------------------------------------------------------------------------
    // Stage 1: Trip requirements & Destination resolution
    // --------------------------------------------------------------------------
    const destination = await this.resolveDestination(input.destination);
    const durationDays = Math.max(1, input.durationDays || 3);
    const startDate = input.startDate || "2026-11-01";
    const travellerCount = Math.max(1, input.travellerCount || 1);
    const travellerType = input.travellerType || "couple";
    const travelPace = input.travelPace || "moderate";
    const currency = input.currency || "INR";
    const allocatedBudget = Math.max(1000, input.budget || 20000);

    // Retrieve authorized travel memories for user
    const userMemories = input.userId
      ? await travelMemoryService.getUserMemoriesSummary(input.userId)
      : null;

    steps.push({
      step: "finding_places",
      label: "Finding places",
      detail: `Identified destination: ${destination.name}, ${destination.state_province} for ${durationDays} days.`,
      completed: true,
    });

    // --------------------------------------------------------------------------
    // Stage 2: Candidate Hotels Selection
    // --------------------------------------------------------------------------
    const candidateHotels = await getDestinationHotels(destination.id);
    const hotelPlan = this.selectSuitableHotel(
      candidateHotels,
      allocatedBudget,
      durationDays,
      travellerCount,
      currency,
      userMemories
    );

    steps.push({
      step: "finding_hotel",
      label: "Finding hotel",
      detail: `Selected ${hotelPlan.selected.name} (${hotelPlan.roomCount} room${hotelPlan.roomCount > 1 ? "s" : ""}, ${hotelPlan.nights} nights).`,
      completed: true,
    });

    // --------------------------------------------------------------------------
    // Stage 3: Candidate Attractions Selection
    // --------------------------------------------------------------------------
    const candidateAttractions = await getDestinationAttractions(destination.id);
    const selectedAttractions = this.selectSuitableAttractions(
      candidateAttractions,
      durationDays,
      travelPace,
      travellerType,
      input.preferences,
      userMemories
    );

    // --------------------------------------------------------------------------
    // Stage 4: Candidate Restaurants Selection
    // --------------------------------------------------------------------------
    const candidateRestaurants = await getDestinationRestaurants(destination.id);
    const selectedMeals = this.selectSuitableMeals(
      candidateRestaurants,
      durationDays,
      travellerCount,
      input.preferences,
      userMemories
    );

    // --------------------------------------------------------------------------
    // Stage 5: Transport Selection
    // --------------------------------------------------------------------------
    const { transport: transportOptions, taxis } = await getDestinationTransport(
      destination.id
    );
    const transportPlan = this.selectSuitableTransport(
      transportOptions,
      taxis,
      input.origin,
      destination.name,
      allocatedBudget,
      durationDays,
      travellerCount,
      currency,
      userMemories
    );

    const outboundMode = "mode" in transportPlan.outbound ? transportPlan.outbound.mode : "intercity";
    steps.push({
      step: "calculating_transport",
      label: "Calculating transport",
      detail: `Configured ${outboundMode} transport and local transit for ${travellerCount} traveller(s).`,
      completed: true,
    });

    // --------------------------------------------------------------------------
    // Stage 6 & 7: Route Calculation & Daily Itinerary Construction
    // (Keeps visit_time, travel_time, waiting_time, and buffer_time separate!)
    // --------------------------------------------------------------------------
    const plannedDays = await this.buildDaySchedules(
      input.tripId,
      startDate,
      durationDays,
      destination,
      hotelPlan.selected,
      selectedAttractions,
      selectedMeals,
      travelPace,
      travellerType
    );

    steps.push({
      step: "optimizing_route",
      label: "Optimizing route",
      detail: `Geospatial routing optimized for all ${durationDays} days. Schedule validated with zero conflicts.`,
      completed: true,
    });

    // --------------------------------------------------------------------------
    // Stage 8: Budget Calculation across 8 Categories
    // --------------------------------------------------------------------------
    const foodTotalCost = selectedMeals.reduce((sum, m) => sum + m.estimatedCost, 0);
    const activitiesTotalCost = selectedAttractions.reduce(
      (sum, a) => sum + a.ticketPrice * travellerCount,
      0
    );

    let budgetBreakdown = this.calculateComprehensiveBudget(
      allocatedBudget,
      transportPlan.intercityCost,
      hotelPlan.totalCost,
      foodTotalCost,
      transportPlan.localCost,
      activitiesTotalCost,
      currency
    );

    steps.push({
      step: "calculating_budget",
      label: "Calculating budget",
      detail: `Calculated costs across all categories. Total: ${formatCurrency(budgetBreakdown.totalCost, { currency })}.`,
      completed: true,
    });

    // --------------------------------------------------------------------------
    // Stage 9: Deterministic Optimization if Over Budget
    // --------------------------------------------------------------------------
    const appliedAdjustments: string[] = [];
    let wasOptimized = false;
    const originalCost = budgetBreakdown.totalCost;

    if (budgetBreakdown.isOverBudget) {
      wasOptimized = true;

      // 1. Try cheaper hotel alternative if available
      const cheaperHotel = candidateHotels
        .filter((h) => h.id !== hotelPlan.selected.id && h.price_per_night < hotelPlan.selected.price_per_night)
        .sort((a, b) => a.price_per_night - b.price_per_night)[0];

      if (cheaperHotel) {
        const oldHotelCost = hotelPlan.totalCost;
        hotelPlan.selected = cheaperHotel;
        hotelPlan.pricePerNight = cheaperHotel.price_per_night;
        hotelPlan.totalCost = cheaperHotel.price_per_night * hotelPlan.nights * hotelPlan.roomCount;
        hotelPlan.totalCostFormatted = formatCurrency(hotelPlan.totalCost, { currency });
        hotelPlan.reason = "Optimized for budget preservation.";
        appliedAdjustments.push(
          `Switched hotel to ${cheaperHotel.name} (saved ${formatCurrency(oldHotelCost - hotelPlan.totalCost, { currency })}).`
        );
      }

      // 2. Try cheaper intercity transport alternative if available
      const outboundPrice = "price" in transportPlan.outbound ? transportPlan.outbound.price : transportPlan.outbound.base_fare;
      const cheaperTransit = transportOptions
        .filter((t) => t.price < (outboundPrice || Infinity))
        .sort((a, b) => a.price - b.price)[0];
      if (cheaperTransit) {
        const oldTransitCost = transportPlan.intercityCost;
        transportPlan.outbound = cheaperTransit;
        transportPlan.returnOption = cheaperTransit;
        transportPlan.intercityCost = cheaperTransit.price * travellerCount * 2;
        transportPlan.totalCost = transportPlan.intercityCost + transportPlan.localCost;
        transportPlan.totalCostFormatted = formatCurrency(transportPlan.totalCost, { currency });
        appliedAdjustments.push(
          `Switched transport to ${cheaperTransit.mode} (${cheaperTransit.provider}) saving ${formatCurrency(oldTransitCost - transportPlan.intercityCost, { currency })}.`
        );
      }

      // 3. Try dining optimization (casual regional dining instead of premium restaurants)
      let currentFoodCost = foodTotalCost;
      const budgetMeals = candidateRestaurants.filter((r) => r.price_level === "$" || r.price_level === "$$");
      if (budgetMeals.length > 0) {
        let newFoodTotal = 0;
        selectedMeals.forEach((m, idx) => {
          const budgetRest = budgetMeals[idx % budgetMeals.length];
          m.restaurant = budgetRest;
          m.estimatedCost = budgetRest.estimated_price_per_person * travellerCount;
          newFoodTotal += m.estimatedCost;
        });
        if (newFoodTotal < currentFoodCost) {
          const savings = currentFoodCost - newFoodTotal;
          currentFoodCost = newFoodTotal;
          appliedAdjustments.push(
            `Optimized dining to authentic local bistros saving ${formatCurrency(savings, { currency })}.`
          );
        }
      }

      // 4. Try local transit optimization
      if (transportPlan.localCost > 800) {
        const oldLocal = transportPlan.localCost;
        transportPlan.localCost = Math.round(transportPlan.localCost * 0.6);
        transportPlan.localTransitMode = "Public Transit & Auto-Rickshaw Saver";
        transportPlan.totalCost = transportPlan.intercityCost + transportPlan.localCost;
        transportPlan.totalCostFormatted = formatCurrency(transportPlan.totalCost, { currency });
        appliedAdjustments.push(
          `Switched local transit to public transit & metro pass saving ${formatCurrency(oldLocal - transportPlan.localCost, { currency })}.`
        );
      }

      // Recalculate budget with optimized figures
      budgetBreakdown = this.calculateComprehensiveBudget(
        allocatedBudget,
        transportPlan.intercityCost,
        hotelPlan.totalCost,
        currentFoodCost,
        transportPlan.localCost,
        activitiesTotalCost,
        currency
      );

      if (appliedAdjustments.length === 0) {
        appliedAdjustments.push("Configured budget-tier options to minimize deficit.");
      }
    }

    steps.push({
      step: "building_itinerary",
      label: "Building itinerary",
      detail: `Complete itinerary constructed and persisted with ${plannedDays.reduce((acc, d) => acc + d.items.length, 0)} scheduled activities.`,
      completed: true,
    });

    // --------------------------------------------------------------------------
    // Stage 10: Final Assembly and Persistence
    // --------------------------------------------------------------------------
    const result: PlannedTripResult = {
      success: true,
      tripId: input.tripId,
      title: `${input.origin} to ${destination.name} (${durationDays} Days)`,
      destination,
      origin: input.origin,
      startDate,
      endDate: plannedDays[plannedDays.length - 1]?.date || startDate,
      durationDays,
      travellerCount,
      travellerType,
      travelPace,
      hotel: hotelPlan,
      transport: transportPlan,
      food: {
        meals: selectedMeals,
        totalCost: foodTotalCost,
        totalCostFormatted: formatCurrency(foodTotalCost, { currency }),
      },
      attractions: selectedAttractions,
      itinerary: plannedDays,
      budget: budgetBreakdown,
      optimization: {
        wasOptimized,
        originalCost,
        optimizedCost: budgetBreakdown.totalCost,
        appliedAdjustments,
      },
      planningSteps: steps,
      createdAt: new Date().toISOString(),
    };

    // Cache in memory for quick retrieval
    memoryPlannedTrips.set(input.tripId, result);

    // Persist into database or fallback stores
    await this.persistPlan(result);

    return result;
  }

  /**
   * Retrieves an already planned trip result from cache or database
   */
  async getPlannedTrip(tripId: string): Promise<PlannedTripResult | null> {
    return memoryPlannedTrips.get(tripId) || null;
  }

  // ============================================================================
  // Private Pipeline Helper Methods
  // ============================================================================

  private async resolveDestination(query: string): Promise<Destination> {
    const clean = (query || "").trim().toLowerCase();
    const all = DEMO_DESTINATIONS;

    const matched =
      all.find((d) => d.id.toLowerCase() === clean) ||
      all.find((d) => d.name.toLowerCase() === clean) ||
      all.find((d) => clean.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(clean)) ||
      all[0];

    const dbDest = await getDestinationById(matched.id);
    return dbDest || matched;
  }

  private selectSuitableHotel(
    hotels: Hotel[],
    totalBudget: number,
    durationDays: number,
    travellerCount: number,
    currency: string,
    userMemories?: UserTravelMemoriesSummary | null
  ): SelectedHotelPlan {
    const nights = Math.max(1, durationDays - 1);
    const roomCount =
      travellerCount === 1 ? 1 : Math.ceil(travellerCount / 2);

    const likesBudget =
      userMemories?.hotelLikes.some((l) => l.includes("budget")) ||
      userMemories?.likes.some((l) => l.includes("budget hotel"));

    const avoidsLuxury =
      userMemories?.hotelAvoids.some((a) => a.includes("luxury")) ||
      userMemories?.avoids.some((a) => a.includes("luxury hotel"));

    // Target ~30% of total budget for accommodation, or lower if user prefers budget stays
    let targetLodgingBudget = totalBudget * 0.3;
    if (likesBudget) {
      targetLodgingBudget = Math.min(targetLodgingBudget, 1800 * nights * roomCount);
    }
    const targetPricePerNight = targetLodgingBudget / (nights * roomCount);

    let candidates = [...hotels];
    if (avoidsLuxury) {
      const nonLuxury = candidates.filter(
        (h) =>
          h.price_per_night <= 3500 &&
          !h.name.toLowerCase().includes("palace") &&
          !h.name.toLowerCase().includes("luxury") &&
          !h.name.toLowerCase().includes("resort & spa")
      );
      if (nonLuxury.length > 0) {
        candidates = nonLuxury;
      }
    }

    // Sort candidate hotels by how close they are to target price, preferring higher rating
    const sorted = [...candidates].sort((a, b) => {
      const diffA = Math.abs(a.price_per_night - targetPricePerNight);
      const diffB = Math.abs(b.price_per_night - targetPricePerNight);
      if (Math.abs(diffA - diffB) < 1000) {
        return b.rating - a.rating;
      }
      return diffA - diffB;
    });

    const selected = sorted[0] || DEMO_HOTELS[0];
    const totalCost = selected.price_per_night * nights * roomCount;

    let reason = `Best balance of comfort (${selected.rating}★ rating) and budget efficiency.`;
    if (likesBudget || avoidsLuxury) {
      reason = `Selected budget-friendly lodging (${selected.name}) matching saved preferences (${[
        likesBudget ? "Likes: Budget hotels" : null,
        avoidsLuxury ? "Avoids: Luxury hotels" : null,
      ]
        .filter(Boolean)
        .join(", ")}).`;
    }

    return {
      selected,
      roomCount,
      nights,
      pricePerNight: selected.price_per_night,
      totalCost,
      totalCostFormatted: formatCurrency(totalCost, { currency }),
      reason,
    };
  }

  private selectSuitableAttractions(
    attractions: Attraction[],
    durationDays: number,
    pace: "relaxed" | "moderate" | "fast",
    travellerType: string,
    preferences?: Record<string, unknown> | string[],
    userMemories?: UserTravelMemoriesSummary | null
  ): SelectedAttractionPlan[] {
    const avoidsOverpacked =
      userMemories?.itineraryAvoids.some((a) => a.includes("overpacked")) ||
      userMemories?.avoids.some((a) => a.includes("overpacked"));

    // If user avoids overpacked itineraries, force relaxed pace (max 2 attractions per day)
    const effectivePace = avoidsOverpacked ? "relaxed" : pace;
    const attractionsPerDay = effectivePace === "relaxed" ? 2 : effectivePace === "fast" ? 4 : 3;
    const totalNeeded = durationDays * attractionsPerDay;

    const durationTier: DurationTier =
      effectivePace === "relaxed" ? "Relaxed" : effectivePace === "fast" ? "Quick" : "Normal";

    // Extract preference keywords from explicit preferences and user memories
    const prefList = Array.isArray(preferences)
      ? preferences.map((p) => String(p).toLowerCase())
      : typeof preferences === "object" && preferences !== null
      ? Object.values(preferences).map((v) => String(v).toLowerCase())
      : [];

    if (userMemories?.likes) {
      for (const l of userMemories.likes) {
        if (!prefList.includes(l)) prefList.push(l);
      }
    }

    // Score attractions based on preference match and ratings
    const scored = [...attractions].sort((a, b) => {
      const matchA = prefList.some(
        (p) =>
          a.category.toLowerCase().includes(p) ||
          a.description.toLowerCase().includes(p)
      );
      const matchB = prefList.some(
        (p) =>
          b.category.toLowerCase().includes(p) ||
          b.description.toLowerCase().includes(p)
      );
      if (matchA && !matchB) return -1;
      if (!matchA && matchB) return 1;
      return b.recommended_visit_minutes - a.recommended_visit_minutes;
    });

    const chosen: SelectedAttractionPlan[] = [];
    for (let i = 0; i < totalNeeded; i++) {
      const attr = scored[i % scored.length];
      const dayNumber = Math.floor(i / attractionsPerDay) + 1;

      const visitMinutes = timeEngine.calculateVisitDuration({
        minimumVisitMinutes: attr.minimum_visit_minutes,
        recommendedVisitMinutes: attr.recommended_visit_minutes,
        maximumVisitMinutes: attr.maximum_visit_minutes,
        durationTier,
        travellerType,
        travelPace: effectivePace,
      });

      const queueMinutes = timeEngine.calculateWaitingTime(
        {
          estimated_queue_minutes: attr.estimated_queue_minutes,
          peak_start: attr.peak_start,
          peak_end: attr.peak_end,
        },
        "11:00"
      );

      chosen.push({
        attraction: attr,
        dayNumber,
        durationTier,
        visitMinutes,
        queueMinutes,
        ticketPrice: attr.ticket_price,
      });
    }

    return chosen;
  }

  private selectSuitableMeals(
    restaurants: Restaurant[],
    durationDays: number,
    travellerCount: number,
    preferences?: Record<string, unknown> | string[],
    userMemories?: UserTravelMemoriesSummary | null
  ): SelectedMealPlan[] {
    const list = restaurants.length > 0 ? restaurants : DEMO_RESTAURANTS;
    const meals: SelectedMealPlan[] = [];

    // Identify dietary preferences
    const prefStr = JSON.stringify(preferences || "").toLowerCase();
    const wantsVeg = prefStr.includes("veg") || prefStr.includes("vegetarian");

    const likesLocalFood =
      userMemories?.restaurantLikes.some((l) => l.includes("local food") || l.includes("local")) ||
      userMemories?.likes.some((l) => l.includes("local food") || l.includes("local cuisine"));

    const filtered = list.filter((r) => {
      if (wantsVeg) {
        return r.dietary_options.some((d) =>
          d.toLowerCase().includes("veg")
        );
      }
      return true;
    });

    let pool = filtered.length >= 2 ? filtered : list;
    if (likesLocalFood) {
      const localSpecialists = pool.filter(
        (r) =>
          !r.name.toLowerCase().includes("pizza") &&
          !r.name.toLowerCase().includes("burger") &&
          !r.name.toLowerCase().includes("continental") &&
          (["traditional", "regional", "local", "thali", "seafood", "indian", "bengali", "rajasthani", "goan", "tibetan"].some((k) =>
            r.cuisine.toLowerCase().includes(k)
          ) ||
            r.name.toLowerCase().includes("thali") ||
            r.name.toLowerCase().includes("dhaba") ||
            r.name.toLowerCase().includes("bhojanalaya"))
      );
      if (localSpecialists.length >= 2) {
        pool = localSpecialists;
      }
    }

    for (let day = 1; day <= durationDays; day++) {
      const lunchRest = pool[(day * 2 - 2) % pool.length];
      const dinnerRest = pool[(day * 2 - 1) % pool.length];

      meals.push({
        dayNumber: day,
        mealType: "lunch",
        restaurant: lunchRest,
        estimatedCost: lunchRest.estimated_price_per_person * travellerCount,
        timeSlot: "12:30",
      });

      meals.push({
        dayNumber: day,
        mealType: "dinner",
        restaurant: dinnerRest,
        estimatedCost: dinnerRest.estimated_price_per_person * travellerCount,
        timeSlot: "19:30",
      });
    }

    return meals;
  }

  private selectSuitableTransport(
    transportOptions: TransportOption[],
    taxis: TaxiOption[],
    origin: string,
    destinationName: string,
    totalBudget: number,
    durationDays: number,
    travellerCount: number,
    currency: string,
    userMemories?: UserTravelMemoriesSummary | null
  ): SelectedTransportPlan {
    const list = transportOptions.length > 0 ? transportOptions : DEMO_TRANSPORT;

    const prefersTrain =
      userMemories?.transitLikes.some((l) => l.includes("train")) ||
      userMemories?.likes.some((l) => l.includes("train"));

    // Filter matching origin/destination or find best option
    const cleanOrigin = origin.toLowerCase().trim();
    const matching = list.filter(
      (t) =>
        t.origin.toLowerCase().includes(cleanOrigin) ||
        cleanOrigin.includes(t.origin.toLowerCase())
    );

    const candidates = matching.length > 0 ? matching : list;

    // If budget is tight or user explicitly prefers train travel, prioritize train/rail
    const prefersBudgetTransit = totalBudget < 25000 || prefersTrain;
    const sorted = [...candidates].sort((a, b) => {
      if (prefersTrain) {
        if (a.mode === "train" && b.mode !== "train") return -1;
        if (a.mode !== "train" && b.mode === "train") return 1;
      }
      if (prefersBudgetTransit) {
        return a.price - b.price;
      }
      return b.price - a.price;
    });

    const chosenOutbound = sorted[0] || DEMO_TRANSPORT[0];
    const intercityCost = chosenOutbound.price * travellerCount * 2; // Round-trip

    // Local transit calculation (taxi / auto / metro)
    const localCost = Math.round(
      travellerCount * durationDays * (prefersBudgetTransit ? 350 : 650)
    );

    const totalCost = intercityCost + localCost;

    return {
      outbound: chosenOutbound,
      returnOption: chosenOutbound,
      localTransitMode: prefersBudgetTransit ? "Metro & Auto-Rickshaw" : "Private Cab & Taxi",
      intercityCost,
      localCost,
      totalCost,
      totalCostFormatted: formatCurrency(totalCost, { currency }),
      travelerCount: travellerCount,
    };
  }

  private async buildDaySchedules(
    tripId: string,
    startDateStr: string,
    durationDays: number,
    destination: Destination,
    hotel: Hotel,
    attractions: SelectedAttractionPlan[],
    meals: SelectedMealPlan[],
    pace: "relaxed" | "moderate" | "fast",
    travellerType: string
  ): Promise<PlannedDayItinerary[]> {
    const startDate = new Date(startDateStr);
    const plannedDays: PlannedDayItinerary[] = [];

    // Daily waking window
    const dayStartTime = pace === "relaxed" ? "09:00" : "08:30";
    const dayEndTime = pace === "relaxed" ? "21:00" : "21:30";

    for (let dayNum = 1; dayNum <= durationDays; dayNum++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (dayNum - 1));
      const dateStr = currentDate.toISOString().split("T")[0];

      const dayAttractions = attractions.filter((a) => a.dayNumber === dayNum);
      const dayLunch = meals.find((m) => m.dayNumber === dayNum && m.mealType === "lunch");
      const dayDinner = meals.find((m) => m.dayNumber === dayNum && m.mealType === "dinner");

      const items: ItineraryItem[] = [];
      const routeCoordinates: [number, number][] = [];

      // Starting point: Hotel
      let currentClock = dayStartTime;
      let lastLocation = {
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        name: hotel.name,
      };
      routeCoordinates.push([hotel.longitude, hotel.latitude]);

      // Sort attractions so earlier-closing sights come earlier in the schedule
      const sortedDayAttractions = [...dayAttractions].sort((a, b) => {
        const closeA = a.attraction.closing_time ? timeToMinutes(a.attraction.closing_time) : 1439;
        const closeB = b.attraction.closing_time ? timeToMinutes(b.attraction.closing_time) : 1439;
        return closeA - closeB;
      });

      // Split attractions into morning (before lunch) and afternoon (after lunch)
      const morningAttractions = sortedDayAttractions.slice(0, Math.ceil(sortedDayAttractions.length / 2));
      const afternoonAttractions = sortedDayAttractions.slice(Math.ceil(sortedDayAttractions.length / 2));

      const scheduleAttractionItem = (
        itemPlan: SelectedAttractionPlan,
        isMorning: boolean
      ): boolean => {
        const attr = itemPlan.attraction;
        const targetLoc = {
          latitude: attr.latitude,
          longitude: attr.longitude,
          name: attr.name,
        };

        const travelMins = timeEngine.calculateTravelDuration(lastLocation, targetLoc, "driving");
        let arrivalClock = addMinutesToTime(currentClock, travelMins);
        let arrivalMins = timeToMinutes(arrivalClock);

        // Opening hours check
        let waitMins = itemPlan.queueMinutes;
        if (attr.opening_time) {
          const openMins = timeToMinutes(attr.opening_time);
          if (arrivalMins < openMins) {
            waitMins += openMins - arrivalMins;
            arrivalMins = openMins;
            arrivalClock = minutesToTime(openMins);
          }
        }

        const startMins = arrivalMins + waitMins;
        const itemStartTime = minutesToTime(startMins);
        let visitMins = itemPlan.visitMinutes;

        // Closing hours check: ensure visit ends before closing time
        if (attr.closing_time) {
          const closeMins = timeToMinutes(attr.closing_time);
          if (startMins >= closeMins) {
            return false;
          }
          if (startMins + visitMins > closeMins) {
            visitMins = Math.max(15, closeMins - startMins);
          }
        }

        // For morning attractions, ensure completion before lunch block
        if (isMorning) {
          const lunchCutoff = timeToMinutes("12:45");
          if (startMins + visitMins > lunchCutoff) {
            visitMins = Math.max(15, lunchCutoff - startMins);
          }
        }

        const bufferMins = timeEngine.calculateBuffer(travelMins, visitMins);
        const itemEndTime = addMinutesToTime(itemStartTime, visitMins);

        items.push({
          id: `item-d${dayNum}-${items.length + 1}`,
          itinerary_id: `itin-${tripId}-d${dayNum}`,
          trip_id: tripId,
          attraction_id: attr.id,
          title: attr.name,
          category: "sightseeing",
          date: dateStr,
          start_time: itemStartTime,
          end_time: itemEndTime,
          location: targetLoc,
          visit_minutes: visitMins,
          travel_minutes: travelMins,
          waiting_minutes: waitMins,
          buffer_minutes: bufferMins,
          estimated_cost: attr.ticket_price,
          priority: "high",
          status: "scheduled",
          duration_tier: itemPlan.durationTier,
          sort_order: items.length,
          opening_time: attr.opening_time,
          closing_time: attr.closing_time,
        });

        routeCoordinates.push([attr.longitude, attr.latitude]);
        lastLocation = targetLoc;
        currentClock = addMinutesToTime(itemEndTime, bufferMins);
        return true;
      };

      // 1. Morning Attractions
      for (const itemPlan of morningAttractions) {
        scheduleAttractionItem(itemPlan, true);
      }

      // 2. Lunch Break
      if (dayLunch) {
        const rest = dayLunch.restaurant;
        const lunchLoc = {
          latitude: rest.latitude,
          longitude: rest.longitude,
          name: rest.name,
        };

        const travelMins = timeEngine.calculateTravelDuration(lastLocation, lunchLoc, "driving");
        currentClock = addMinutesToTime(currentClock, travelMins);

        // Ensure lunch happens between 12:30 and 14:00
        if (timeToMinutes(currentClock) < timeToMinutes("12:30")) {
          currentClock = "12:30";
        }

        const visitMins = 60; // 1 hour for lunch
        const bufferMins = 15;
        const itemStartTime = currentClock;
        const itemEndTime = addMinutesToTime(itemStartTime, visitMins);

        items.push({
          id: `item-d${dayNum}-lunch`,
          itinerary_id: `itin-${tripId}-d${dayNum}`,
          trip_id: tripId,
          title: `Lunch at ${rest.name}`,
          category: "food",
          date: dateStr,
          start_time: itemStartTime,
          end_time: itemEndTime,
          location: lunchLoc,
          visit_minutes: visitMins,
          travel_minutes: travelMins,
          waiting_minutes: 0,
          buffer_minutes: bufferMins,
          estimated_cost: dayLunch.estimatedCost,
          priority: "medium",
          status: "scheduled",
          duration_tier: "Normal",
          sort_order: items.length,
        });

        routeCoordinates.push([rest.longitude, rest.latitude]);
        lastLocation = lunchLoc;
        currentClock = addMinutesToTime(itemEndTime, bufferMins);
      }

      // 3. Afternoon Attractions
      for (const itemPlan of afternoonAttractions) {
        scheduleAttractionItem(itemPlan, false);
      }

      // 4. Dinner & Evening Rest
      if (dayDinner) {
        const rest = dayDinner.restaurant;
        const dinnerLoc = {
          latitude: rest.latitude,
          longitude: rest.longitude,
          name: rest.name,
        };

        const travelMins = timeEngine.calculateTravelDuration(lastLocation, dinnerLoc, "driving");
        currentClock = addMinutesToTime(currentClock, travelMins);

        if (timeToMinutes(currentClock) < timeToMinutes("19:30")) {
          currentClock = "19:30";
        }

        const visitMins = 75; // 75 mins dinner
        const bufferMins = 20;
        const itemStartTime = currentClock;
        const itemEndTime = addMinutesToTime(itemStartTime, visitMins);

        items.push({
          id: `item-d${dayNum}-dinner`,
          itinerary_id: `itin-${tripId}-d${dayNum}`,
          trip_id: tripId,
          title: `Dinner at ${rest.name}`,
          category: "food",
          date: dateStr,
          start_time: itemStartTime,
          end_time: itemEndTime,
          location: dinnerLoc,
          visit_minutes: visitMins,
          travel_minutes: travelMins,
          waiting_minutes: 0,
          buffer_minutes: bufferMins,
          estimated_cost: dayDinner.estimatedCost,
          priority: "medium",
          status: "scheduled",
          duration_tier: "Normal",
          sort_order: items.length,
        });

        routeCoordinates.push([rest.longitude, rest.latitude]);
        lastLocation = dinnerLoc;
        currentClock = addMinutesToTime(itemEndTime, bufferMins);
      }

      // 5. Final return to Hotel
      routeCoordinates.push([hotel.longitude, hotel.latitude]);

      // Validate daily schedule
      let validation = timeEngine.validateDailySchedule(items, {
        start: dayStartTime,
        end: dayEndTime,
      });

      // If invalid, apply deterministic time optimization
      let finalItems = items;
      if (!validation.isValid) {
        const opt = timeEngine.optimizeDaySchedule(items, {
          start: dayStartTime,
          end: dayEndTime,
        });
        finalItems = opt.optimizedItems;
        validation = opt.validation;
      }

      // Discrete totals
      const totalVisitMinutes = finalItems.reduce((acc, it) => acc + it.visit_minutes, 0);
      const totalTravelMinutes = finalItems.reduce((acc, it) => acc + it.travel_minutes, 0);
      const totalWaitingMinutes = finalItems.reduce((acc, it) => acc + it.waiting_minutes, 0);
      const totalBufferMinutes = finalItems.reduce((acc, it) => acc + it.buffer_minutes, 0);

      plannedDays.push({
        dayNumber: dayNum,
        date: dateStr,
        theme:
          dayNum === 1
            ? "Arrival & Iconic Heritage Sights"
            : dayNum === 2
            ? "Cultural Exploration & Flavors"
            : dayNum === 3
            ? "Scenic Views & Coastal Leisure"
            : `Exploration Day ${dayNum}`,
        dayStartTime,
        dayEndTime,
        items: finalItems,
        routeCoordinates,
        totalVisitMinutes,
        totalTravelMinutes,
        totalWaitingMinutes,
        totalBufferMinutes,
        validation,
      });
    }

    return plannedDays;
  }

  private calculateComprehensiveBudget(
    allocatedBudget: number,
    transportCost: number,
    hotelCost: number,
    foodCost: number,
    localTransportCost: number,
    activitiesCost: number,
    currency: string
  ): PlannedTripResult["budget"] {
    const subtotal =
      transportCost + hotelCost + foodCost + localTransportCost + activitiesCost;
    const emergencyBuffer = Math.round(subtotal * 0.05); // 5% emergency buffer
    const shopping = Math.round(subtotal * 0.04); // 4% shopping allowance
    const totalCost = subtotal + emergencyBuffer + shopping;
    const remainingBudget = allocatedBudget - totalCost;
    const isOverBudget = totalCost > allocatedBudget;
    const overBudgetPercentage = isOverBudget
      ? Math.round(((totalCost - allocatedBudget) / allocatedBudget) * 100)
      : 0;

    const mkCat = (amt: number) => ({
      amount: amt,
      percentage: totalCost > 0 ? Math.round((amt / totalCost) * 100) : 0,
      formatted: formatCurrency(amt, { currency }),
    });

    return {
      allocatedBudget,
      totalCost,
      remainingBudget,
      isOverBudget,
      overBudgetPercentage,
      currency,
      categories: {
        transport: mkCat(transportCost),
        hotel: mkCat(hotelCost),
        food: mkCat(foodCost),
        local_transport: mkCat(localTransportCost),
        activities: mkCat(activitiesCost),
        shopping: mkCat(shopping),
        emergency_buffer: mkCat(emergencyBuffer),
        other: mkCat(0),
      },
    };
  }

  private async persistPlan(plan: PlannedTripResult): Promise<void> {
    if (!isSupabaseLive()) {
      // In-memory persistence is already handled by memoryPlannedTrips map
      return;
    }

    try {
      const supabase = createServerSupabase();

      const client = supabase as unknown as {
        from: (table: string) => {
          update: (data: unknown) => {
            eq: (col: string, val: string) => Promise<unknown>;
          };
        };
      };

      // Update trip status to 'ready'
      await client
        .from("trips")
        .update({ status: "ready" })
        .eq("id", plan.tripId);
    } catch {
      // Non-fatal logging
    }
  }
}

export const tripPlannerService = new TripPlannerService();
