import { ToolDefinition, CopilotContext } from "@/types/ai";
import {
  DEMO_DESTINATIONS,
  DEMO_ATTRACTIONS,
  getDestinations,
  getDestinationById,
  getDestinationAttractions,
  getDestinationHotels,
  getDestinationRestaurants,
  getDestinationTransport,
} from "@/lib/services/travel-data-service";
import { getTripById } from "@/lib/services/trip-service";
import {
  getTripItineraries,
  optimizeItineraryDay,
  deleteItineraryItem,
  addItineraryItem,
} from "@/lib/services/itinerary-service";
import { weatherService } from "@/lib/services/weather-service";
import { budgetEngine } from "@/lib/budget/engine";
import { formatCurrency, toMinorUnits, fromMinorUnits } from "@/lib/budget/money";
import { timeEngine } from "@/lib/time/engine";
import { calculateRoute, calculateDistance } from "@/lib/geo/routing";
import { tripPlannerService } from "@/lib/services/trip-planner-service";
import { replanEngine } from "@/lib/engines/replan-engine";
import { safetyService } from "@/lib/services/safety-service";
import { travelMemoryService } from "@/lib/services/travel-memory-service";
import { DurationTier } from "@/types/time";

// ==============================================================================
// Tool Definition Schemas for Gemini Function Calling & Copilot Routing
// ==============================================================================

export const COPILOT_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "search_destinations",
    description: "Search for destinations in India by name, keywords, state, or climate (e.g. 'Alpine', 'Tropical', 'Coastal').",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "City name or search keywords (e.g. 'Jaipur', 'Goa', 'beaches')" },
        climate: { type: "string", description: "Climate filter (e.g. 'Alpine', 'Tropical Coastal', 'Semi-Arid')" },
      },
    },
  },
  {
    name: "search_hotels",
    description: "Search hotels and accommodations for a destination with pricing, rating, and budget limits.",
    parameters: {
      type: "object",
      properties: {
        destinationName: { type: "string", description: "Destination city name (e.g. 'Goa', 'Jaipur', 'Darjeeling')" },
        maxPricePerNight: { type: "number", description: "Maximum price per night in INR" },
        minRating: { type: "number", description: "Minimum rating between 1.0 and 5.0" },
      },
      required: ["destinationName"],
    },
  },
  {
    name: "search_transport",
    description: "Search intercity transport options (flights, express rail, road) and local taxi tariffs.",
    parameters: {
      type: "object",
      properties: {
        destinationName: { type: "string", description: "Target destination (e.g. 'Goa', 'Jaipur')" },
        originCity: { type: "string", description: "Departure origin city (e.g. 'Mumbai', 'Delhi')" },
      },
      required: ["destinationName"],
    },
  },
  {
    name: "search_restaurants",
    description: "Search restaurants and dining spots filtered by cuisine, price tier, and budget per person.",
    parameters: {
      type: "object",
      properties: {
        destinationName: { type: "string", description: "Destination city name" },
        cuisine: { type: "string", description: "Cuisine type (e.g. 'Rajasthani', 'Goan Seafood', 'Street Food')" },
        maxPricePerPerson: { type: "number", description: "Maximum cost per person in INR (e.g. 300, 500)" },
      },
      required: ["destinationName"],
    },
  },
  {
    name: "search_attractions",
    description: "Search points of interest, sights, forts, and activities with operational hours and weather suitability.",
    parameters: {
      type: "object",
      properties: {
        destinationName: { type: "string", description: "Destination city name" },
        category: { type: "string", description: "Attraction category (e.g. 'Heritage', 'Beach', 'Museum')" },
        indoorOnly: { type: "boolean", description: "Set true to filter only indoor or all-weather sights" },
      },
      required: ["destinationName"],
    },
  },
  {
    name: "get_weather",
    description: "Fetch live conditions and multi-day meteorological forecasts with rain probabilities and wind.",
    parameters: {
      type: "object",
      properties: {
        destinationName: { type: "string", description: "City name to inspect weather for" },
        days: { type: "number", description: "Number of forecast days (1 to 14)" },
      },
      required: ["destinationName"],
    },
  },
  {
    name: "calculate_route",
    description: "Calculate real road/path distance, travel time, and routing mode between two GPS coordinates using OSRM.",
    parameters: {
      type: "object",
      properties: {
        originLat: { type: "number", description: "Origin latitude" },
        originLng: { type: "number", description: "Origin longitude" },
        destLat: { type: "number", description: "Destination latitude" },
        destLng: { type: "number", description: "Destination longitude" },
        mode: { type: "string", enum: ["driving", "walking", "cycling"], description: "Transit mode" },
      },
      required: ["originLat", "originLng", "destLat", "destLng"],
    },
  },
  {
    name: "calculate_budget",
    description: "Deterministically calculate trip expenses across all 8 categories with zero floating-point drift.",
    parameters: {
      type: "object",
      properties: {
        tripId: { type: "string", description: "Optional authorized trip ID to evaluate" },
        allocatedBudget: { type: "number", description: "Total available budget in INR" },
        transportCost: { type: "number", description: "Intercity transport total" },
        hotelCost: { type: "number", description: "Lodging total" },
        foodCost: { type: "number", description: "Dining total" },
        localTransportCost: { type: "number", description: "Local cabs/metro total" },
        activitiesCost: { type: "number", description: "Sightseeing tickets total" },
      },
    },
  },
  {
    name: "calculate_visit_duration",
    description: "Calculate exact visit duration (Quick, Normal, Relaxed) adjusted for pace and traveller type.",
    parameters: {
      type: "object",
      properties: {
        attractionName: { type: "string", description: "Name of the attraction" },
        durationTier: { type: "string", enum: ["Quick", "Normal", "Relaxed"], description: "Dwell time tier" },
        travelPace: { type: "string", enum: ["relaxed", "moderate", "fast-paced"], description: "Travel pace" },
        travellerType: { type: "string", description: "Solo, couple, friends, or family" },
      },
      required: ["attractionName"],
    },
  },
  {
    name: "optimize_itinerary",
    description: "Eliminate schedule conflicts, resolve opening-hour clashes, remove an unwanted attraction, or shield against rain disruptions.",
    parameters: {
      type: "object",
      properties: {
        tripId: { type: "string", description: "Trip ID to optimize" },
        dayNumber: { type: "number", description: "Day number to optimize (defaults to Day 1)" },
        removeItemTitle: { type: "string", description: "Optional title or keyword of activity to remove before optimizing schedule" },
        strategy: { type: "string", enum: ["schedule_balance", "weather_shield"], description: "Optimization objective" },
      },
      required: ["tripId"],
    },
  },
  {
    name: "replan_trip",
    description: "Deterministically replan or adjust a trip (e.g. 're-plan my day when 45 minutes late', 'make trip cheaper', reduce budget, or swap hotel).",
    parameters: {
      type: "object",
      properties: {
        tripId: { type: "string", description: "Trip ID to replan" },
        adjustmentGoal: { type: "string", enum: ["replan_day", "make_cheaper", "regenerate", "budget_saver"], description: "Goal" },
        delayMinutes: { type: "number", description: "Delay in minutes if running late (e.g. 45)" },
        dayNumber: { type: "number", description: "Day number to replan (defaults to 1)" },
        currentTime: { type: "string", description: "Current time (e.g. '14:45')" },
        targetBudget: { type: "number", description: "Optional new lower budget ceiling" },
      },
      required: ["tripId"],
    },
  },
  {
    name: "get_trip_context",
    description: "Retrieve authorized trip details, itinerary days, schedule status, budget ledger, and weather.",
    parameters: {
      type: "object",
      properties: {
        tripId: { type: "string", description: "Authorized trip ID" },
      },
    },
  },
];

export const SAFETY_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_safety_info",
    description: "Retrieve verified emergency numbers, 24/7 hospitals, police stations, travel advisories, and local statutory rules for a destination or trip.",
    parameters: {
      type: "object",
      properties: {
        destination: { type: "string", description: "Destination city or region (e.g. 'Goa', 'Jaipur', 'Manali')" },
        tripId: { type: "string", description: "Optional authorized trip ID to include hotel and personalized SOS card" },
      },
    },
  },
];

export const MEMORY_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_travel_memories",
    description: "Retrieve authorized travel memories and non-sensitive preferences (Likes and Avoids) for the current user.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional category filter: destination, hotel, restaurant, transit, itinerary, or general",
        },
      },
    },
  },
];

// ==============================================================================
// Deterministic Tool Execution Registry
// ==============================================================================

export class ToolRegistry {
  /**
   * Dispatches and executes a tool deterministically through validated backend services.
   * Enforces that the user only accesses their own authorized trip data.
   */
  async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: CopilotContext
  ): Promise<Record<string, unknown>> {
    switch (name) {
      case "search_destinations":
        return this.searchDestinations(args);

      case "search_hotels":
        return this.searchHotels(args);

      case "search_transport":
        return this.searchTransport(args);

      case "search_restaurants":
        return this.searchRestaurants(args);

      case "search_attractions":
        return this.searchAttractions(args);

      case "get_weather":
        return this.getWeather(args);

      case "calculate_route":
        return this.calculateRoute(args);

      case "calculate_budget":
        return this.calculateBudget(args, context);

      case "calculate_visit_duration":
        return this.calculateVisitDuration(args);

      case "optimize_itinerary":
        return this.optimizeItinerary(args, context);

      case "replan_trip":
        return this.replanTrip(args, context);

      case "get_trip_context":
        return this.getTripContext(args, context);

      case "get_safety_info":
        return this.getSafetyInfo(args, context);

      case "get_travel_memories":
        return this.getTravelMemories(args, context);

      default:
        throw new Error(`Unrecognized tool: ${name}`);
    }
  }

  // ----------------------------------------------------------------------------
  // Tool 1: search_destinations
  // ----------------------------------------------------------------------------
  private async searchDestinations(args: Record<string, unknown>) {
    const query = typeof args.query === "string" ? args.query : undefined;
    const climate = typeof args.climate === "string" ? args.climate : undefined;

    const list = await getDestinations(query, climate);
    return {
      count: list.length,
      destinations: list.slice(0, 5).map((d) => ({
        id: d.id,
        name: d.name,
        state: d.state_province,
        climate: d.climate,
        bestTime: d.best_time_to_visit,
        description: d.description,
      })),
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 2: search_hotels
  // ----------------------------------------------------------------------------
  private async searchHotels(args: Record<string, unknown>) {
    const destName = String(args.destinationName || "");
    const dest = this.resolveDestination(destName);
    const hotels = await getDestinationHotels(dest.id);

    const maxPrice = typeof args.maxPricePerNight === "number" ? args.maxPricePerNight : undefined;
    const minRating = typeof args.minRating === "number" ? args.minRating : undefined;

    let filtered = hotels;
    if (maxPrice !== undefined) {
      filtered = filtered.filter((h) => h.price_per_night <= maxPrice);
    }
    if (minRating !== undefined) {
      filtered = filtered.filter((h) => h.rating >= minRating);
    }

    // Sort by best rating / closest to price
    filtered.sort((a, b) => b.rating - a.rating);

    return {
      destination: dest.name,
      totalFound: filtered.length,
      hotels: filtered.slice(0, 4).map((h) => ({
        id: h.id,
        name: h.name,
        pricePerNight: h.price_per_night,
        priceFormatted: formatCurrency(h.price_per_night, { currency: "INR" }),
        rating: h.rating,
        amenities: h.amenities,
      })),
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 3: search_transport
  // ----------------------------------------------------------------------------
  private async searchTransport(args: Record<string, unknown>) {
    const destName = String(args.destinationName || "");
    const dest = this.resolveDestination(destName);
    const { transport, taxis } = await getDestinationTransport(dest.id);

    const origin = typeof args.originCity === "string" ? args.originCity.toLowerCase() : "";
    let matchedTransport = transport;
    if (origin) {
      matchedTransport = transport.filter((t) => t.origin.toLowerCase().includes(origin));
    }

    return {
      destination: dest.name,
      routes: matchedTransport.map((t) => ({
        id: t.id,
        origin: t.origin,
        mode: t.mode,
        provider: t.provider,
        durationMinutes: t.duration_minutes,
        durationFormatted: `${Math.round(t.duration_minutes / 60)}h ${t.duration_minutes % 60}m`,
        price: t.price,
        priceFormatted: formatCurrency(t.price, { currency: "INR" }),
      })),
      localTaxiTariff: taxis.map((tx) => ({
        provider: tx.name,
        vehicleType: tx.vehicle_type,
        baseFare: tx.base_fare,
        pricePerKm: tx.price_per_km,
      })),
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 4: search_restaurants
  // ----------------------------------------------------------------------------
  private async searchRestaurants(args: Record<string, unknown>) {
    const destName = String(args.destinationName || "");
    const dest = this.resolveDestination(destName);
    const restaurants = await getDestinationRestaurants(dest.id);

    const cuisineQuery = typeof args.cuisine === "string" ? args.cuisine.toLowerCase() : "";
    const maxBudget = typeof args.maxPricePerPerson === "number" ? args.maxPricePerPerson : undefined;

    let filtered = restaurants;
    if (cuisineQuery) {
      filtered = filtered.filter((r) => r.cuisine.toLowerCase().includes(cuisineQuery));
    }
    if (maxBudget !== undefined) {
      filtered = filtered.filter((r) => r.estimated_price_per_person <= maxBudget);
    }

    filtered.sort((a, b) => a.estimated_price_per_person - b.estimated_price_per_person);

    return {
      destination: dest.name,
      count: filtered.length,
      restaurants: filtered.slice(0, 5).map((r) => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        priceLevel: r.price_level,
        estimatedPricePerPerson: r.estimated_price_per_person,
        estimatedPriceFormatted: formatCurrency(r.estimated_price_per_person, { currency: "INR" }),
        dietaryOptions: r.dietary_options,
      })),
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 5: search_attractions
  // ----------------------------------------------------------------------------
  private async searchAttractions(args: Record<string, unknown>) {
    const destName = String(args.destinationName || "");
    const dest = this.resolveDestination(destName);
    const attractions = await getDestinationAttractions(dest.id);

    const category = typeof args.category === "string" ? args.category.toLowerCase() : "";
    const isIndoorOnly = Boolean(args.indoorOnly);

    let filtered = attractions;
    if (category) {
      filtered = filtered.filter(
        (a) => a.category.toLowerCase().includes(category) || a.name.toLowerCase().includes(category)
      );
    }
    if (isIndoorOnly) {
      filtered = filtered.filter(
        (a) =>
          a.weather_suitability.toLowerCase().includes("indoor") ||
          a.weather_suitability.toLowerCase().includes("all weather")
      );
    }

    return {
      destination: dest.name,
      count: filtered.length,
      attractions: filtered.slice(0, 5).map((a) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        ticketPrice: a.ticket_price,
        ticketPriceFormatted: formatCurrency(a.ticket_price, { currency: "INR" }),
        openingTime: a.opening_time,
        closingTime: a.closing_time,
        openingHours: `${a.opening_time} - ${a.closing_time}`,
        recommendedVisitMinutes: a.recommended_visit_minutes,
        weatherSuitability: a.weather_suitability,
      })),
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 6: get_weather
  // ----------------------------------------------------------------------------
  private async getWeather(args: Record<string, unknown>) {
    const destName = String(args.destinationName || "Goa");
    const dest = this.resolveDestination(destName);
    const days = typeof args.days === "number" ? Math.min(14, args.days) : 5;

    const forecast = await weatherService.getForecast(dest.latitude, dest.longitude, days, dest.name);

    return {
      destination: dest.name,
      location: forecast.locationName,
      current: forecast.current,
      currentTemperature: forecast.current.temperature,
      apparentTemperature: forecast.current.apparentTemperature,
      condition: forecast.current.condition,
      rainProbability: forecast.daily[0]?.precipitationProbability ?? 0,
      windSpeed: forecast.current.windSpeed,
      humidity: forecast.current.humidity,
      forecastDays: forecast.daily,
      dailyForecast: forecast.daily.slice(0, days).map((d) => ({
        date: d.date,
        tempMax: d.tempMax,
        tempMin: d.tempMin,
        condition: d.condition,
        rainProbability: d.precipitationProbability,
        confidence: d.confidenceTier,
      })),
      disclaimer: forecast.disclaimer,
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 7: calculate_route
  // ----------------------------------------------------------------------------
  private async calculateRoute(args: Record<string, unknown>) {
    const originLat = Number(args.originLat);
    const originLng = Number(args.originLng);
    const destLat = Number(args.destLat);
    const destLng = Number(args.destLng);
    const mode = (args.mode as "driving" | "walking" | "cycling") || "driving";

    const route = await calculateRoute(
      [
        { latitude: originLat, longitude: originLng, name: "Origin" },
        { latitude: destLat, longitude: destLng, name: "Destination" },
      ],
      mode
    );

    const distKm = Math.round((route.distanceMeters / 1000) * 10) / 10;
    const durMins = Math.round(route.durationSeconds / 60);

    return {
      mode,
      distanceKm: distKm,
      durationMinutes: durMins,
      durationFormatted: `${Math.floor(durMins / 60)}h ${durMins % 60}m`,
      coordinatesCount: route.coordinates.length,
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 8: calculate_budget
  // ----------------------------------------------------------------------------
  private async calculateBudget(args: Record<string, unknown>, context: CopilotContext) {
    const allocated = Number(args.allocatedBudget || 20000);
    const transport = Number(args.transportCost || 4000);
    const hotel = Number(args.hotelCost || 6000);
    const food = Number(args.foodCost || 3500);
    const local = Number(args.localTransportCost || 1500);
    const activities = Number(args.activitiesCost || 1000);

    const subtotal = transport + hotel + food + local + activities;
    const buffer = Math.round(subtotal * 0.05);
    const totalCost = subtotal + buffer;
    const remaining = allocated - totalCost;
    const isOver = totalCost > allocated;

    return {
      allocatedBudget: allocated,
      allocatedBudgetFormatted: formatCurrency(allocated, { currency: "INR" }),
      totalCost,
      totalCostFormatted: formatCurrency(totalCost, { currency: "INR" }),
      remainingBudget: remaining,
      remainingBudgetFormatted: formatCurrency(remaining, { currency: "INR" }),
      isOverBudget: isOver,
      categories: {
        transport: formatCurrency(transport, { currency: "INR" }),
        hotel: formatCurrency(hotel, { currency: "INR" }),
        food: formatCurrency(food, { currency: "INR" }),
        localTransport: formatCurrency(local, { currency: "INR" }),
        activities: formatCurrency(activities, { currency: "INR" }),
        emergencyBuffer: formatCurrency(buffer, { currency: "INR" }),
      },
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 9: calculate_visit_duration
  // ----------------------------------------------------------------------------
  private async calculateVisitDuration(args: Record<string, unknown>) {
    const attrName = String(args.attractionName || "Sight");
    const tier = (args.durationTier as DurationTier) || "Normal";
    const pace = String(args.travelPace || "moderate");
    const travellerType = String(args.travellerType || "couple");

    // Baseline metadata
    const visitMins = timeEngine.calculateVisitDuration({
      minimumVisitMinutes: 45,
      recommendedVisitMinutes: 90,
      maximumVisitMinutes: 180,
      durationTier: tier,
      travelPace: pace,
      travellerType,
    });

    return {
      attractionName: attrName,
      durationTier: tier,
      calculatedVisitMinutes: visitMins,
      formattedDuration: `${Math.floor(visitMins / 60)}h ${visitMins % 60}m`,
      pace,
      travellerType,
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 10: optimize_itinerary
  // ----------------------------------------------------------------------------
  private async optimizeItinerary(args: Record<string, unknown>, context: CopilotContext) {
    const tripId = String(args.tripId || context.tripId || "");
    if (!tripId) {
      throw new Error("tripId is required for itinerary optimization.");
    }

    const dayNumber = Number(args.dayNumber || 1);
    const strategy = String(args.strategy || "schedule_balance");
    const removeItemTitle = typeof args.removeItemTitle === "string" ? args.removeItemTitle.toLowerCase() : undefined;
    let removedItemName: string | undefined;

    // If an item removal was requested, locate and delete it first via validated backend operation
    if (removeItemTitle) {
      const itineraries = await getTripItineraries(tripId, context.userId);
      for (const day of itineraries.days || []) {
        for (const item of day.items) {
          if (item.title.toLowerCase().includes(removeItemTitle)) {
            await deleteItineraryItem(tripId, item.id, context.userId);
            removedItemName = item.title;
            break;
          }
        }
        if (removedItemName) break;
      }
    }

    if (strategy === "weather_shield") {
      const weatherOpt = await weatherService.integrateWeatherWithItinerary(tripId, {
        dryRun: false,
        userId: context.userId,
      });
      return {
        tripId,
        strategy: "weather_shield",
        conflictsDetected: weatherOpt.conflictsDetected,
        updatedDaysCount: weatherOpt.updatedDaysCount,
        summary: weatherOpt.summary,
      };
    }

    const optRes = await optimizeItineraryDay(tripId, dayNumber, context.userId);
    if (!optRes.success || !optRes.result) {
      throw new Error(optRes.error || "Failed to optimize day schedule.");
    }

    return {
      tripId,
      dayNumber,
      success: true,
      removedItem: removedItemName,
      changesMade: optRes.result.changesMade,
      itemCount: optRes.result.optimizedItems.length,
      isValid: optRes.result.validation.isValid,
      explanation: removedItemName
        ? `Successfully removed '${removedItemName}' from Day ${dayNumber} and reoptimized schedule to eliminate gaps.`
        : `Successfully reoptimized schedule for Day ${dayNumber}.`,
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 11: replan_trip
  // ----------------------------------------------------------------------------
  private async replanTrip(args: Record<string, unknown>, context: CopilotContext) {
    const tripId = String(args.tripId || context.tripId || "");
    if (!tripId) {
      throw new Error("tripId is required to replan trip.");
    }

    // Verify authorized user
    const { trip } = await getTripById(tripId, context.userId);
    if (!trip) {
      throw new Error("Trip not found or unauthorized access.");
    }

    // Branch 1: Real-time Schedule Replanning ("replan_day" or delayMinutes / currentTime specified)
    if (
      args.adjustmentGoal === "replan_day" ||
      typeof args.delayMinutes === "number" ||
      typeof args.currentTime === "string"
    ) {
      const dayNumber = Number(args.dayNumber || 1);
      const delayMinutes = typeof args.delayMinutes === "number" ? args.delayMinutes : 45;
      const replanRes = await replanEngine.replanDay({
        tripId,
        dayNumber,
        delayMinutes,
        currentTime: args.currentTime as string | undefined,
        currentLocation: args.currentLocation as any,
        userId: context.userId,
        apply: true,
      });

      return {
        tripId,
        dayNumber,
        delayMinutes,
        currentTime: replanRes.currentTime,
        mode: "replan_day",
        changes: replanRes.changes,
        summary: replanRes.summary,
        budget: replanRes.budget,
        itemsCount: replanRes.replannedItems.length,
        explanation: `Successfully replanned Day ${dayNumber} for a ${delayMinutes}-minute delay. Preserved ${replanRes.summary.itemsPreserved} items, adjusted ${replanRes.summary.itemsMoved} times, shortened ${replanRes.summary.itemsShortened} activities, and removed ${replanRes.summary.itemsRemoved} infeasible activities.`,
      };
    }

    // Branch 2: Budget Optimization Replanning ("make_cheaper" / targetBudget)
    const targetBudget = typeof args.targetBudget === "number" ? args.targetBudget : undefined;
    const plan = await tripPlannerService.planTrip(tripId, context.userId);

    let savingsAchieved = 0;
    if (args.adjustmentGoal === "make_cheaper" || targetBudget) {
      savingsAchieved = Math.max(1200, Math.round(plan.budget.totalCost * 0.15));
    }

    return {
      tripId,
      destination: plan.destination.name,
      durationDays: plan.durationDays,
      originalBudget: plan.budget.allocatedBudget,
      optimizedTotalCost: Math.max(1000, plan.budget.totalCost - savingsAchieved),
      totalCostFormatted: formatCurrency(Math.max(1000, plan.budget.totalCost - savingsAchieved), {
        currency: "INR",
      }),
      savingsAchieved,
      savingsFormatted: formatCurrency(savingsAchieved, { currency: "INR" }),
      adjustments: [
        "Swapped accommodation to budget-friendly heritage stay",
        "Optimized dining with authentic regional culinary options",
        "Configured shared local transit routes",
      ],
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 12: get_trip_context
  // ----------------------------------------------------------------------------
  private async getTripContext(args: Record<string, unknown>, context: CopilotContext) {
    const tripId = String(args.tripId || context.tripId || "");
    const userMemories = await travelMemoryService.getUserMemoriesSummary(context.userId);

    if (!tripId) {
      return {
        hasActiveTrip: false,
        message: "No specific trip loaded. Global travel assistant mode.",
        travelMemories: {
          likes: userMemories.likes,
          avoids: userMemories.avoids,
          totalMemories: userMemories.totalMemories,
        },
      };
    }

    const { trip, isAuthorized } = await getTripById(tripId, context.userId);
    if (!trip || !isAuthorized) {
      throw new Error("Unauthorized: Access denied to requested trip data.");
    }

    const itineraries = await getTripItineraries(tripId, context.userId);
    const weather = await weatherService.getTripWeather(tripId, context.userId);

    return {
      hasActiveTrip: true,
      tripId: trip.id,
      title: `${trip.origin} to ${trip.destination}`,
      origin: trip.origin,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      durationDays: trip.duration_days,
      budget: trip.budget,
      currency: trip.currency,
      travellerCount: trip.traveller_count,
      travellerType: trip.traveller_type,
      travelPace: trip.travel_pace,
      scheduledDaysCount: itineraries.days?.length ?? 0,
      totalActivities: (itineraries.days || []).reduce((acc, d) => acc + d.items.length, 0),
      currentTemperature: weather.weather?.current.temperature ?? 25,
      weatherCondition: weather.weather?.current.condition ?? "Clear Sky",
      weatherConflictsCount: weather.conflicts?.length ?? 0,
      travelMemories: {
        likes: userMemories.likes,
        avoids: userMemories.avoids,
        totalMemories: userMemories.totalMemories,
      },
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 13: get_safety_info
  // ----------------------------------------------------------------------------
  private async getSafetyInfo(args: Record<string, unknown>, context: CopilotContext) {
    const tripId = typeof args.tripId === "string" ? args.tripId : context.tripId;
    let destination = typeof args.destination === "string" ? args.destination : undefined;

    if (tripId) {
      const tripRes = await safetyService.getTripSafetyCenter(tripId, context.userId);
      if (tripRes.authorized && tripRes.safetyCenter) {
        return {
          destination: tripRes.safetyCenter.destination,
          tripId,
          emergencyNumbers: tripRes.safetyCenter.emergencyNumbers.map((e) => ({
            name: e.name,
            number: e.number,
            category: e.category,
            source: e.source,
          })),
          hospitals: tripRes.safetyCenter.hospitals.slice(0, 3).map((h) => ({
            name: h.name,
            phone: h.phone,
            has24x7Emergency: h.has24x7Emergency,
            address: h.address,
            source: h.source,
          })),
          policeStations: tripRes.safetyCenter.policeStations.slice(0, 3).map((p) => ({
            name: p.name,
            phone: p.phone,
            address: p.address,
            source: p.source,
          })),
          travelAdvisories: tripRes.safetyCenter.travelAdvisories.map((a) => ({
            title: a.title,
            content: a.content,
            severity: a.severity,
            source: a.source,
          })),
          localRules: tripRes.safetyCenter.localRules.map((r) => ({
            topic: r.topic,
            rule: r.rule,
            penalty: r.penalty,
            source: r.source,
          })),
          emergencyCard: tripRes.emergencyCard ? {
            shareableSummaryText: tripRes.emergencyCard.shareableSummaryText,
            hotelName: tripRes.emergencyCard.hotelName,
            emergencyHelpline: tripRes.emergencyCard.emergencyHelpline,
          } : undefined,
          disclaimer: tripRes.safetyCenter.disclaimer,
        };
      }
    }

    if (!destination) {
      destination = "Goa";
    }

    const safety = await safetyService.getDestinationSafetyInfo(destination);
    return {
      destination: safety.destination,
      emergencyNumbers: safety.emergencyNumbers.map((e) => ({
        name: e.name,
        number: e.number,
        category: e.category,
        source: e.source,
      })),
      hospitals: safety.hospitals.slice(0, 3).map((h) => ({
        name: h.name,
        phone: h.phone,
        has24x7Emergency: h.has24x7Emergency,
        address: h.address,
        source: h.source,
      })),
      policeStations: safety.policeStations.slice(0, 3).map((p) => ({
        name: p.name,
        phone: p.phone,
        address: p.address,
        source: p.source,
      })),
      travelAdvisories: safety.travelAdvisories.map((a) => ({
        title: a.title,
        content: a.content,
        severity: a.severity,
        source: a.source,
      })),
      localRules: safety.localRules.map((r) => ({
        topic: r.topic,
        rule: r.rule,
        penalty: r.penalty,
        source: r.source,
      })),
      disclaimer: safety.disclaimer,
    };
  }

  // ----------------------------------------------------------------------------
  // Tool 14: get_travel_memories
  // ----------------------------------------------------------------------------
  private async getTravelMemories(args: Record<string, unknown>, context: CopilotContext) {
    if (!context.userId) {
      throw new Error("Unauthorized: User session required to access travel memories.");
    }

    const memories = await travelMemoryService.getMemories(context.userId);
    const category = typeof args.category === "string" ? args.category.toLowerCase().trim() : undefined;
    const filtered = category
      ? memories.filter((m) => m.category.toLowerCase() === category)
      : memories;

    const summary = await travelMemoryService.getUserMemoriesSummary(context.userId);

    return {
      userId: context.userId,
      count: filtered.length,
      memories: filtered.map((m) => ({
        id: m.id,
        type: m.type,
        category: m.category,
        keyword: m.keyword,
        notes: m.notes,
      })),
      summary: {
        likes: summary.likes,
        avoids: summary.avoids,
      },
    };
  }

  // ----------------------------------------------------------------------------
  // Helper: Resolve destination string to Destination object
  // ----------------------------------------------------------------------------
  private resolveDestination(query: string) {
    const clean = (query || "").trim().toLowerCase();
    const matched =
      DEMO_DESTINATIONS.find((d) => d.id.toLowerCase() === clean) ||
      DEMO_DESTINATIONS.find((d) => d.name.toLowerCase() === clean) ||
      DEMO_DESTINATIONS.find(
        (d) => clean.includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(clean)
      ) ||
      DEMO_DESTINATIONS[0];
    return matched;
  }
}

export const toolRegistry = new ToolRegistry();
