import { Destination, WeatherForecast } from "@/types/travel";
import {
  DestinationDiscoveryInput,
  DiscoveredDestinationResult,
  DestinationDiscoveryResponse,
} from "@/types/discovery";
import {
  DEMO_DESTINATIONS,
  getDestinationAttractions,
  getDestinationHotels,
  getDestinationTransport,
} from "@/lib/services/travel-data-service";
import { budgetEngine } from "@/lib/budget/engine";
import {
  toMinorUnits,
  fromMinorUnits,
  formatCurrency,
  addMinor,
} from "@/lib/budget/money";
import { getDestinationWeather } from "@/lib/geo/weather";
import { travelMemoryService } from "@/lib/services/travel-memory-service";
import { UserTravelMemoriesSummary } from "@/types/memories";

// Coordinates for major Indian transit origin hubs
const ORIGIN_COORDINATES: Record<string, { lat: number; lng: number }> = {
  kolkata: { lat: 22.5726, lng: 88.3639 },
  delhi: { lat: 28.6139, lng: 77.209 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  goa: { lat: 15.2993, lng: 74.124 },
  darjeeling: { lat: 27.041, lng: 88.2663 },
  manali: { lat: 32.2396, lng: 77.1887 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
};

function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export class DestinationDiscoveryEngine {
  /**
   * Discovers feasible travel destinations matching budget, origin, duration, and preferences.
   * Strictly relies on the existing BudgetEngine for zero floating-point drift calculations.
   */
  async discoverDestinations(
    input: DestinationDiscoveryInput
  ): Promise<DestinationDiscoveryResponse> {
    const originClean = (input.origin || "").trim().toLowerCase();
    const budget = Math.max(1000, input.budget || 20000);
    const currency = input.currency || "INR";
    const durationDays = Math.max(1, input.durationDays || 3);
    const travellerCount = Math.max(1, input.travellerCount || 1);
    const travellerType = input.travellerType || "friends";

    // Extract preference tokens
    const prefTokens = this.extractPreferenceTokens(input.preferences);

    // Resolve origin coordinates (fallback to Kolkata/Delhi)
    const originCoords =
      ORIGIN_COORDINATES[originClean] ||
      ORIGIN_COORDINATES[
        Object.keys(ORIGIN_COORDINATES).find((k) =>
          originClean.includes(k) || k.includes(originClean)
        ) || "kolkata"
      ];

    const candidateDestinations = DEMO_DESTINATIONS.filter(
      (d) => !originClean.includes(d.name.toLowerCase())
    );

    // Retrieve authorized travel preferences (memories) if userId is provided
    const userMemories = input.userId
      ? await travelMemoryService.getUserMemoriesSummary(input.userId)
      : null;

    const evaluatedResults: DiscoveredDestinationResult[] = [];

    for (const destination of candidateDestinations) {
      // 1. Calculate approximate distance & travel time
      const distanceKm = calculateHaversineKm(
        originCoords.lat,
        originCoords.lng,
        destination.latitude,
        destination.longitude
      );

      const { approximateTravelTime, travelModeSummary, estimatedTransitFarePerPerson } =
        await this.estimateTransitFromOrigin(
          originClean,
          destination,
          distanceKm,
          budget,
          userMemories
        );

      // 2. Transport Cost using BudgetEngine
      const transportCostRes = budgetEngine.calculateTransportCost({
        pricePerPerson: estimatedTransitFarePerPerson * 2, // Round-trip
        travellerCount,
        currency,
      });

      // 3. Hotel Cost using BudgetEngine
      const nights = Math.max(1, durationDays - 1);
      const roomCount = travellerCount === 1 ? 1 : Math.ceil(travellerCount / 2);
      const hotels = await getDestinationHotels(destination.id);
      const selectedHotel = this.pickCandidateHotel(
        hotels,
        budget,
        nights,
        roomCount,
        userMemories
      );

      const hotelCostRes = budgetEngine.calculateHotelCost({
        pricePerNight: selectedHotel.price_per_night,
        nights,
        roomCount,
        currency,
      });

      // 4. Food Cost using BudgetEngine
      // Target ~20% of total budget for food across trip duration
      const targetDailyMeal = Math.max(
        200,
        Math.min(900, Math.round((budget * 0.2) / (durationDays * travellerCount)))
      );
      const foodCostRes = budgetEngine.calculateFoodCost({
        dailyCostPerPerson: targetDailyMeal,
        durationDays,
        travellerCount,
        currency,
      });

      // 5. Local Transport using BudgetEngine
      // Target ~10% of total budget for local transit
      const targetDailyLocal = Math.max(
        80,
        Math.min(350, Math.round((budget * 0.1) / (durationDays * travellerCount)))
      );
      const localTransportRes = budgetEngine.calculateLocalTransportCost({
        dailyCost: targetDailyLocal * travellerCount,
        durationDays,
        currency,
      });

      // 6. Activities using BudgetEngine
      const attractions = await getDestinationAttractions(destination.id);
      const topAttractions = attractions.slice(0, 4);
      const activityCostRes = budgetEngine.calculateActivityCost({
        activities: topAttractions.map((a) => ({ ticketPrice: a.ticket_price })),
        travellerCount,
        currency,
      });

      // 7. Emergency Buffer using BudgetEngine
      const subtotalMinor =
        transportCostRes.minorUnits +
        hotelCostRes.minorUnits +
        foodCostRes.minorUnits +
        localTransportRes.minorUnits +
        activityCostRes.minorUnits;

      const emergencyBufferRes = budgetEngine.calculateEmergencyBuffer({
        subtotalMinor,
        percentage: 5,
        currency,
      });

      // 8. Total Trip Cost using BudgetEngine
      const tripCostRes = budgetEngine.calculateTripCost({
        transport: transportCostRes,
        hotel: hotelCostRes,
        food: foodCostRes,
        local_transport: localTransportRes,
        activities: activityCostRes,
        emergency_buffer: emergencyBufferRes,
      });

      const totalCost = tripCostRes.totalMajor;
      const surplusDeficit = budget - totalCost;
      const isWithinBudget = totalCost <= budget;

      // 9. Feasibility Filter Check
      // Infeasible if cost is over budget (> 25% over) or travel time dominates short trip
      const oneWayTravelHours = this.parseApproximateHours(approximateTravelTime);
      const isTimeInfeasible = durationDays <= 2 && oneWayTravelHours > 16;
      const isCostInfeasible = totalCost > budget * 1.25;

      if (isTimeInfeasible || isCostInfeasible) {
        continue;
      }

      // 10. Preference Matching & Scoring
      const { matchScore, matchReasons } = this.calculatePreferenceMatch(
        destination,
        topAttractions,
        prefTokens,
        travellerType,
        userMemories
      );

      // 11. Fetch live or fallback weather from Open-Meteo
      const weather = await getDestinationWeather(
        destination.latitude,
        destination.longitude,
        destination.name
      );

      evaluatedResults.push({
        destination,
        matchScore,
        matchReasons,
        estimatedTotalCost: totalCost,
        estimatedTotalCostFormatted: formatCurrency(totalCost, { currency }),
        budgetSurplusDeficit: surplusDeficit,
        budgetSurplusDeficitFormatted: formatCurrency(Math.abs(surplusDeficit), {
          currency,
        }),
        isWithinBudget,

        transportCost: transportCostRes.majorUnits,
        transportCostFormatted: formatCurrency(transportCostRes.majorUnits, { currency }),
        hotelCost: hotelCostRes.majorUnits,
        hotelCostFormatted: formatCurrency(hotelCostRes.majorUnits, { currency }),
        foodCost: foodCostRes.majorUnits,
        foodCostFormatted: formatCurrency(foodCostRes.majorUnits, { currency }),
        activitiesCost: activityCostRes.majorUnits,
        activitiesCostFormatted: formatCurrency(activityCostRes.majorUnits, { currency }),
        localTransportCost: localTransportRes.majorUnits,
        localTransportCostFormatted: formatCurrency(localTransportRes.majorUnits, { currency }),
        emergencyBufferCost: emergencyBufferRes.majorUnits,
        emergencyBufferCostFormatted: formatCurrency(emergencyBufferRes.majorUnits, { currency }),

        recommendedDays: Math.min(durationDays, this.getRecommendedDays(destination.id)),
        approximateTravelTime,
        travelModeSummary,
        majorAttractions: topAttractions.map((a) => ({
          name: a.name,
          category: a.category,
          ticketPrice: a.ticket_price,
        })),
        weather,

        isEstimate: true,
        estimateDisclaimer:
          "Indicative estimate based on DEMO catalog rates and seasonal transport estimates. Real-time booking prices may vary.",
      });
    }

    // Sort results: highest match score first, then best budget fit
    evaluatedResults.sort((a, b) => {
      if (Math.abs(a.matchScore - b.matchScore) > 10) {
        return b.matchScore - a.matchScore;
      }
      return b.budgetSurplusDeficit - a.budgetSurplusDeficit;
    });

    return {
      success: true,
      query: input,
      destinations: evaluatedResults,
      totalEvaluated: candidateDestinations.length,
      totalFeasible: evaluatedResults.length,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private extractPreferenceTokens(preferences?: string[] | string): string[] {
    if (!preferences) return [];
    if (Array.isArray(preferences)) {
      return preferences.map((p) => p.toLowerCase().trim()).filter(Boolean);
    }
    return preferences
      .toLowerCase()
      .split(/[\s,+/]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 2);
  }

  private async estimateTransitFromOrigin(
    origin: string,
    destination: Destination,
    distanceKm: number,
    budget: number,
    userMemories?: UserTravelMemoriesSummary | null
  ): Promise<{
    approximateTravelTime: string;
    travelModeSummary: string;
    estimatedTransitFarePerPerson: number;
  }> {
    const prefersTrain =
      userMemories?.transitLikes.some((l) => l.includes("train")) ||
      userMemories?.likes.some((l) => l.includes("train"));

    // 1. Check if direct catalog transport exists
    const { transport } = await getDestinationTransport(destination.id);
    const direct = transport.find(
      (t) =>
        t.origin.toLowerCase().includes(origin) ||
        origin.includes(t.origin.toLowerCase())
    );

    if (direct) {
      const hours = Math.round(direct.duration_minutes / 60);
      const mins = direct.duration_minutes % 60;
      return {
        approximateTravelTime: `${hours}h ${mins > 0 ? `${mins}m` : ""} by ${direct.mode}`,
        travelModeSummary: `${direct.provider} (${direct.mode.toUpperCase()})${
          prefersTrain && direct.mode === "train" ? " (saved preference: Train travel)" : ""
        }`,
        estimatedTransitFarePerPerson: direct.price,
      };
    }

    // 2. Geospatial transit physics estimation based on distance
    if (distanceKm <= 350) {
      // Short distance: Road / Express train
      const hours = Math.max(3, Math.round(distanceKm / 55));
      const fare = Math.max(450, Math.round(distanceKm * 2.2));
      return {
        approximateTravelTime: `~${hours}h by Express Train / Cab`,
        travelModeSummary: prefersTrain
          ? "Express Train (saved preference: Train travel)"
          : "Express Train / Intercity Road",
        estimatedTransitFarePerPerson: fare,
      };
    }

    if (distanceKm <= 850) {
      // Medium distance: Overnight Rail / Regional Flight
      const prefersRail = prefersTrain || budget < 25000;
      if (prefersRail) {
        const hours = Math.round(distanceKm / 65);
        const fare = Math.round(distanceKm * 1.5);
        return {
          approximateTravelTime: `~${hours}h by Overnight Express Train`,
          travelModeSummary: prefersTrain
            ? "Superfast Rail (3AC) (saved preference: Train travel)"
            : "Superfast Rail (3AC)",
          estimatedTransitFarePerPerson: fare,
        };
      }
      return {
        approximateTravelTime: "~2h 15m Flight (+2h airport)",
        travelModeSummary: "Domestic Direct Flight",
        estimatedTransitFarePerPerson: 3200,
      };
    }

    // Long distance (> 850 km)
    if (prefersTrain) {
      const railHours = Math.round(distanceKm / 70);
      return {
        approximateTravelTime: `~${railHours}h by Long-Distance Rail`,
        travelModeSummary: "Mail / Express Train (3AC) (saved preference: Train travel)",
        estimatedTransitFarePerPerson: 1800,
      };
    }

    const prefersFlight = budget >= 25000;
    if (prefersFlight) {
      return {
        approximateTravelTime: "~2h 45m Flight (+2h airport)",
        travelModeSummary: "Domestic Economy Flight",
        estimatedTransitFarePerPerson: 3800,
      };
    }

    const railHours = Math.round(distanceKm / 70);
    return {
      approximateTravelTime: `~${railHours}h by Long-Distance Rail`,
      travelModeSummary: "Mail / Express Train (Sleeper/3AC)",
      estimatedTransitFarePerPerson: 1600,
    };
  }

  private pickCandidateHotel(
    hotels: Array<{ price_per_night: number; rating: number; id: string; name: string }>,
    budget: number,
    nights: number,
    rooms: number,
    userMemories?: UserTravelMemoriesSummary | null
  ) {
    const likesBudget =
      userMemories?.hotelLikes.some((l) => l.includes("budget")) ||
      userMemories?.likes.some((l) => l.includes("budget hotels") || l.includes("budget hotel"));

    const avoidsLuxury =
      userMemories?.hotelAvoids.some((a) => a.includes("luxury")) ||
      userMemories?.avoids.some((a) => a.includes("luxury hotels") || a.includes("luxury hotel"));

    // Budget allocated to hotel is ~30-35% of total budget (scaled down if user prefers budget stays)
    let targetNightlyPerRoom = Math.max(600, Math.round((budget * 0.32) / (nights * rooms)));
    if (likesBudget) {
      targetNightlyPerRoom = Math.min(targetNightlyPerRoom, 1500);
    }

    let candidatePool = [...hotels];
    if (avoidsLuxury) {
      const nonLuxury = candidatePool.filter(
        (h) =>
          h.price_per_night <= 3500 &&
          !h.name.toLowerCase().includes("palace") &&
          !h.name.toLowerCase().includes("luxury") &&
          !h.name.toLowerCase().includes("resort & spa")
      );
      if (nonLuxury.length > 0) {
        candidatePool = nonLuxury;
      }
    }

    if (candidatePool.length > 0) {
      // Find hotels within affordable reach
      const affordable = candidatePool.filter((h) => h.price_per_night <= targetNightlyPerRoom * 1.6);
      if (affordable.length > 0) {
        return affordable.sort(
          (a, b) =>
            Math.abs(a.price_per_night - targetNightlyPerRoom) -
            Math.abs(b.price_per_night - targetNightlyPerRoom)
        )[0];
      }
      const cheapest = [...candidatePool].sort((a, b) => a.price_per_night - b.price_per_night)[0];
      if (cheapest.price_per_night <= targetNightlyPerRoom * 2.5) {
        return cheapest;
      }
    }

    // Fallback: standard budget lodge or homestay scaled to the traveler's lodging budget
    return {
      id: "lodging-budget-stay",
      name: "Cozy Homestay & Budget Lodge",
      price_per_night: Math.min(targetNightlyPerRoom, 1400),
      rating: 4.2,
    };
  }

  private calculatePreferenceMatch(
    destination: Destination,
    attractions: Array<{ name: string; category: string; description: string }>,
    prefTokens: string[],
    travellerType: string,
    userMemories?: UserTravelMemoriesSummary | null
  ): { matchScore: number; matchReasons: string[] } {
    let score = 70; // baseline interest
    const reasons: string[] = [];

    const destText = `${destination.name} ${destination.state_province} ${destination.description} ${destination.climate}`.toLowerCase();
    const attrText = attractions
      .map((a) => `${a.name} ${a.category} ${a.description}`)
      .join(" ")
      .toLowerCase();

    for (const token of prefTokens) {
      let matched = false;

      if (token === "nature" || token === "mountains" || token === "hills") {
        if (destText.includes("alpine") || destText.includes("himalayan") || destText.includes("hill")) {
          score += 15;
          const r = "Majestic alpine landscapes and scenic mountain vistas";
          if (!reasons.includes(r)) reasons.push(r);
          matched = true;
        } else if (destText.includes("tropical") || destText.includes("coastal")) {
          score += 8;
          const r = "Lush tropical greenery and scenic coastal terrain";
          if (!reasons.includes(r)) reasons.push(r);
          matched = true;
        }
      }

      if (token === "adventure" || token === "trekking" || token === "sports") {
        if (
          attrText.includes("adventure") ||
          attrText.includes("valley") ||
          attrText.includes("pass") ||
          destText.includes("himalayan") ||
          destText.includes("hill")
        ) {
          score += 15;
          const r = "Thrilling outdoor sports, trekking, and adventure hubs";
          if (!reasons.includes(r)) reasons.push(r);
          matched = true;
        } else if (destText.includes("coastal") || destText.includes("beach")) {
          score += 10;
          const r = "Exciting coastal water sports and coastal expeditions";
          if (!reasons.includes(r)) reasons.push(r);
          matched = true;
        }
      }

      if (token === "beach" || token === "coastal" || token === "sea") {
        if (destText.includes("coastal") || destText.includes("beach") || destText.includes("sea")) {
          score += 18;
          const r = "Golden beaches and scenic Arabian sea coastline";
          if (!reasons.includes(r)) reasons.push(r);
          matched = true;
        }
      }

      if (token === "heritage" || token === "culture" || token === "history") {
        if (
          destText.includes("heritage") ||
          destText.includes("palace") ||
          destText.includes("fort") ||
          attrText.includes("heritage") ||
          attrText.includes("palace") ||
          attrText.includes("fort")
        ) {
          score += 15;
          const r = "Rich royal palaces, ancient forts, and cultural landmarks";
          if (!reasons.includes(r)) reasons.push(r);
          matched = true;
        }
      }

      if (token === "food" || token === "cuisine") {
        score += 8;
        const r = "Renowned regional gastronomy and iconic food culture";
        if (!reasons.includes(r)) reasons.push(r);
        matched = true;
      }

      if (!matched && (destText.includes(token) || attrText.includes(token))) {
        score += 8;
        const r = `Highlights matching '${token}'`;
        if (!reasons.includes(r)) reasons.push(r);
      }
    }

    // Evaluate user travel memories (Likes & Avoids)
    if (userMemories) {
      for (const like of userMemories.likes) {
        if (like.includes("nature") || like.includes("mountain") || like.includes("hill")) {
          if (
            destText.includes("alpine") ||
            destText.includes("himalayan") ||
            destText.includes("hill") ||
            destText.includes("tropical") ||
            destText.includes("coastal") ||
            attrText.includes("nature") ||
            attrText.includes("waterfall")
          ) {
            score += 15;
            const r = "Matches your saved preference: Nature";
            if (!reasons.includes(r)) reasons.push(r);
          }
        }
        if (like.includes("local food") || like.includes("food")) {
          score += 10;
          const r = "Matches your saved preference: Local food";
          if (!reasons.includes(r)) reasons.push(r);
        }
        if (like.includes("budget hotel") || like.includes("budget")) {
          const r = "Matches your saved preference: Budget hotels";
          if (!reasons.includes(r)) reasons.push(r);
        }
        if (like.includes("train")) {
          const r = "Matches your saved preference: Train travel";
          if (!reasons.includes(r)) reasons.push(r);
        }
      }

      for (const avoid of userMemories.avoids) {
        if (avoid.includes("luxury")) {
          const r = "Selected cost-effective stays (avoids luxury hotels)";
          if (!reasons.includes(r)) reasons.push(r);
        }
        if (avoid.includes("overpacked")) {
          const r = "Curated with relaxed pace (avoids overpacked itineraries)";
          if (!reasons.includes(r)) reasons.push(r);
        }
        if (avoid.includes("crowd") && (destText.includes("bustling") || destText.includes("metropolitan"))) {
          score -= 10;
        }
      }
    }

    // Traveller type compatibility
    if (travellerType === "friends") {
      score += 4;
      const r = "Ideal group dynamics for friends exploring together";
      if (!reasons.includes(r)) reasons.push(r);
    } else if (travellerType === "couple") {
      score += 4;
      const r = "Charming romantic viewpoints and atmosphere";
      if (!reasons.includes(r)) reasons.push(r);
    }

    return {
      matchScore: Math.min(99, Math.max(50, score)),
      matchReasons: reasons.length > 0 ? reasons.slice(0, 4) : ["Balanced cultural and scenic discovery"],
    };
  }

  private parseApproximateHours(travelTimeStr: string): number {
    const match = travelTimeStr.match(/(\d+)h/);
    return match ? parseInt(match[1], 10) : 4;
  }

  private getRecommendedDays(destinationId: string): number {
    switch (destinationId) {
      case "dest-darjeeling":
        return 4;
      case "dest-manali":
        return 5;
      case "dest-goa":
        return 5;
      case "dest-jaipur":
        return 3;
      case "dest-delhi":
        return 3;
      case "dest-mumbai":
        return 3;
      case "dest-kolkata":
        return 3;
      case "dest-bengaluru":
        return 3;
      default:
        return 4;
    }
  }
}

export const destinationDiscoveryEngine = new DestinationDiscoveryEngine();
