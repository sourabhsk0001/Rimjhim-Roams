import {
  CurrentWeather,
  WeatherForecastResponse,
  HistoricalWeatherResponse,
  WeatherSnapshot,
  WeatherConflictResolution,
  WeatherItineraryIntegrationResult,
  HourlyWeather,
} from "@/types/weather";
import {
  WeatherProvider,
  openMeteoWeatherProvider,
} from "@/lib/weather/provider";
import { weatherCache } from "@/lib/weather/cache";
import { getTripById } from "@/lib/services/trip-service";
import {
  getTripItineraries,
  persistOptimizedItems,
} from "@/lib/services/itinerary-service";
import {
  DEMO_DESTINATIONS,
  DEMO_ATTRACTIONS,
  getDestinationAttractions,
} from "@/lib/services/travel-data-service";
import {
  DayItineraryData,
  ItineraryItem,
} from "@/types/time";
import { Attraction } from "@/types/travel";
import { timeToMinutes, minutesToTime, addMinutesToTime } from "@/lib/time/engine";

export class WeatherService {
  constructor(private provider: WeatherProvider = openMeteoWeatherProvider) {}

  /**
   * Fetches real-time current weather with caching
   */
  async getCurrentWeather(
    latitude: number,
    longitude: number,
    locationName?: string
  ): Promise<CurrentWeather> {
    const cached = weatherCache.getCurrent(latitude, longitude);
    if (cached) return cached;

    const live = await this.provider.getCurrentWeather(latitude, longitude);
    weatherCache.setCurrent(latitude, longitude, live);
    return live;
  }

  /**
   * Fetches multi-day hourly & daily weather forecast with caching
   */
  async getForecast(
    latitude: number,
    longitude: number,
    days: number = 7,
    locationName: string = "Destination"
  ): Promise<WeatherForecastResponse> {
    const cached = weatherCache.getForecast(latitude, longitude, days);
    if (cached) return cached;

    const forecast = await this.provider.getForecast(
      latitude,
      longitude,
      days,
      locationName
    );
    weatherCache.setForecast(latitude, longitude, days, forecast);
    return forecast;
  }

  /**
   * Fetches historical weather observations or falls back to climatological averages
   */
  async getHistoricalDataIfAvailable(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    locationName: string = "Destination"
  ): Promise<HistoricalWeatherResponse[]> {
    const cached = weatherCache.getHistorical(
      latitude,
      longitude,
      startDate,
      endDate
    );
    if (cached) return cached;

    const history = await this.provider.getHistoricalDataIfAvailable(
      latitude,
      longitude,
      startDate,
      endDate,
      locationName
    );
    weatherCache.setHistorical(latitude, longitude, startDate, endDate, history);
    return history;
  }

  /**
   * Stores a persistent weather snapshot for a trip
   */
  async storeWeatherSnapshot(
    tripId: string,
    destinationId: string | undefined,
    latitude: number,
    longitude: number,
    date: string,
    snapshotData: WeatherForecastResponse
  ): Promise<WeatherSnapshot> {
    return weatherCache.saveSnapshot(
      tripId,
      destinationId,
      latitude,
      longitude,
      date,
      snapshotData
    );
  }

  /**
   * Retrieves weather snapshots for a trip
   */
  async getWeatherSnapshots(tripId: string): Promise<WeatherSnapshot[]> {
    return weatherCache.getSnapshotsForTrip(tripId);
  }

  /**
   * Complete trip weather package: loads coordinates, forecast, snapshots,
   * and runs weather-itinerary conflict analysis.
   */
  async getTripWeather(
    tripId: string,
    userId: string = "anonymous-or-system"
  ): Promise<{
    success: boolean;
    weather?: WeatherForecastResponse;
    snapshots?: WeatherSnapshot[];
    conflicts?: WeatherConflictResolution[];
    locationName?: string;
    error?: string;
  }> {
    const { trip } = await getTripById(tripId, userId);
    if (!trip) {
      return { success: false, error: "Trip not found." };
    }

    const { latitude, longitude, locationName, destinationId } =
      this.resolveCoordinates(trip.destination);

    const durationDays = Math.max(1, Math.min(14, trip.duration_days || 3));
    const forecast = await this.getForecast(
      latitude,
      longitude,
      durationDays,
      locationName
    );

    // Save weather snapshot
    const today = trip.start_date || new Date().toISOString().substring(0, 10);
    await this.storeWeatherSnapshot(
      tripId,
      destinationId,
      latitude,
      longitude,
      today,
      forecast
    );

    const snapshots = await this.getWeatherSnapshots(tripId);

    // Load itinerary and analyze for weather conflicts
    let conflicts: WeatherConflictResolution[] = [];
    const itineraryRes = await getTripItineraries(tripId, userId);
    if (itineraryRes.success && itineraryRes.days && itineraryRes.days.length > 0) {
      const indoorAttractions = await this.getCandidateIndoorAttractions(destinationId);
      for (const day of itineraryRes.days) {
        const dayConflicts = this.detectWeatherConflicts(
          day,
          forecast.hourly,
          indoorAttractions
        );
        conflicts = conflicts.concat(dayConflicts);
      }
    }

    return {
      success: true,
      weather: forecast,
      snapshots,
      conflicts,
      locationName,
    };
  }

  /**
   * Analyzes an itinerary day against hourly weather.
   * If an outdoor activity conflicts with poor weather (e.g. rain at 3 PM),
   * finds another valid time (e.g. 5 PM) or replaces with an indoor attraction.
   */
  detectWeatherConflicts(
    day: DayItineraryData,
    hourlyForecast: HourlyWeather[],
    candidateIndoorAttractions: Attraction[] = []
  ): WeatherConflictResolution[] {
    const resolutions: WeatherConflictResolution[] = [];

    // Filter hourly forecast matching this day's date or relative day hours
    const dayHourly = hourlyForecast.filter(
      (h) => h.time.startsWith(day.date)
    );
    const hourlyLookup = new Map<number, HourlyWeather>();
    if (dayHourly.length > 0) {
      for (const h of dayHourly) hourlyLookup.set(h.hour, h);
    } else {
      // Fallback matching by hour of day
      for (const h of hourlyForecast.slice(0, 24)) hourlyLookup.set(h.hour, h);
    }

    for (const item of day.items) {
      if (!this.isOutdoorActivity(item)) {
        continue;
      }

      const startHour = parseInt(item.start_time.split(":")[0] || "0", 10);
      const endHour = Math.min(23, parseInt(item.end_time.split(":")[0] || "0", 10));

      // Inspect hourly conditions during the activity
      let rainyHour: HourlyWeather | null = null;
      for (let h = startHour; h <= endHour; h++) {
        const weather = hourlyLookup.get(h);
        if (weather && this.isAdverseWeather(weather)) {
          rainyHour = weather;
          break;
        }
      }

      if (!rainyHour) {
        continue; // Good weather; no conflict
      }

      // ------------------------------------------------------------------------
      // Conflict Detected! Resolve deterministically.
      // ------------------------------------------------------------------------
      const conflictReason = `${rainyHour.condition} predicted at ${rainyHour.hour}:00 (${rainyHour.precipitationProbability}% precipitation probability).`;

      // Strategy 1: Attempt Rescheduling to a dry hour window on the same day
      const dryWindow = this.findDryTimeWindow(
        item,
        day,
        hourlyLookup
      );

      if (dryWindow) {
        resolutions.push({
          id: `res-${item.id}-${Date.now()}`,
          itemId: item.id,
          itemTitle: item.title,
          dayNumber: day.day_number,
          date: day.date,
          originalStartTime: item.start_time,
          originalEndTime: item.end_time,
          rainProbability: rainyHour.precipitationProbability,
          weatherCondition: rainyHour.condition,
          conflictReason,
          action: "reschedule_time",
          newStartTime: dryWindow.start,
          newEndTime: dryWindow.end,
          explanation: `Rain probability is high (${rainyHour.precipitationProbability}%) at ${item.start_time}. Rescheduled ${item.title} to ${dryWindow.start}-${dryWindow.end} when rain probability drops to ${dryWindow.rainProbability}%.`,
        });
        continue;
      }

      // Strategy 2: Replace with an Indoor Attraction
      const replacement = this.findIndoorReplacement(
        item,
        candidateIndoorAttractions,
        day
      );

      if (replacement) {
        resolutions.push({
          id: `res-${item.id}-${Date.now()}`,
          itemId: item.id,
          itemTitle: item.title,
          dayNumber: day.day_number,
          date: day.date,
          originalStartTime: item.start_time,
          originalEndTime: item.end_time,
          rainProbability: rainyHour.precipitationProbability,
          weatherCondition: rainyHour.condition,
          conflictReason,
          action: "replace_indoor",
          replacementAttraction: {
            id: replacement.id,
            name: replacement.name,
            category: replacement.category,
            weatherSuitability: replacement.weather_suitability,
            ticketPrice: replacement.ticket_price,
          },
          explanation: `Continuous adverse weather during afternoon hours. Replaced outdoor activity with indoor attraction '${replacement.name}' (${replacement.category}) to maintain travel momentum without weather disruption.`,
        });
        continue;
      }

      // Strategy 3: Multi-day Move or General Advisory
      resolutions.push({
        id: `res-${item.id}-${Date.now()}`,
        itemId: item.id,
        itemTitle: item.title,
        dayNumber: day.day_number,
        date: day.date,
        originalStartTime: item.start_time,
        originalEndTime: item.end_time,
        rainProbability: rainyHour.precipitationProbability,
        weatherCondition: rainyHour.condition,
        conflictReason,
        action: "move_day",
        explanation: `Sustained adverse weather conditions throughout Day ${day.day_number}. Suggest swapping with a dry day in multi-day forecast.`,
      });
    }

    return resolutions;
  }

  /**
   * Integrates weather recommendations with the trip's itinerary.
   * Can run in dry-run mode (preview) or apply mode (persists changes).
   */
  async integrateWeatherWithItinerary(
    tripId: string,
    options: { dryRun?: boolean; userId?: string } = {}
  ): Promise<WeatherItineraryIntegrationResult> {
    const userId = options.userId || "anonymous-or-system";
    const dryRun = options.dryRun ?? false;

    const { trip } = await getTripById(tripId, userId);
    if (!trip) {
      throw new Error(`Trip ${tripId} not found.`);
    }

    const { latitude, longitude, locationName, destinationId } =
      this.resolveCoordinates(trip.destination);
    const forecast = await this.getForecast(
      latitude,
      longitude,
      trip.duration_days || 3,
      locationName
    );

    const itineraryRes = await getTripItineraries(tripId, userId);
    if (!itineraryRes.success || !itineraryRes.days) {
      throw new Error("Failed to load trip itinerary days.");
    }

    const indoorAttractions = await this.getCandidateIndoorAttractions(destinationId);
    const allResolutions: WeatherConflictResolution[] = [];
    let updatedDaysCount = 0;

    for (const day of itineraryRes.days) {
      const dayResolutions = this.detectWeatherConflicts(
        day,
        forecast.hourly,
        indoorAttractions
      );

      if (dayResolutions.length > 0) {
        allResolutions.push(...dayResolutions);

        if (!dryRun) {
          // Apply changes to the day's items
          const updatedItems = this.applyDayResolutions(day.items, dayResolutions);
          await persistOptimizedItems(day.id, tripId, updatedItems);
          updatedDaysCount++;
        }
      }
    }

    return {
      tripId,
      analyzedDaysCount: itineraryRes.days.length,
      conflictsDetected: allResolutions.length,
      resolutions: allResolutions,
      updatedDaysCount: dryRun ? 0 : updatedDaysCount,
      summary:
        allResolutions.length === 0
          ? "No weather conflicts detected. All outdoor activities have favorable weather conditions."
          : `Detected ${allResolutions.length} weather conflict(s). ${
              dryRun
                ? "Previewing recommended time shifts and indoor replacements."
                : `Successfully updated ${updatedDaysCount} day(s) in your itinerary to bypass adverse weather.`
            }`,
    };
  }

  /**
   * Applies specific weather resolutions directly to the itinerary
   */
  async applyWeatherResolutions(
    tripId: string,
    userId: string,
    resolutions: WeatherConflictResolution[]
  ): Promise<{ success: boolean; appliedCount: number; error?: string }> {
    const itineraryRes = await getTripItineraries(tripId, userId);
    if (!itineraryRes.success || !itineraryRes.days) {
      return { success: false, appliedCount: 0, error: "Failed to load itinerary." };
    }

    let appliedCount = 0;

    for (const day of itineraryRes.days) {
      const dayResolutions = resolutions.filter((r) => r.dayNumber === day.day_number);
      if (dayResolutions.length > 0) {
        const updatedItems = this.applyDayResolutions(day.items, dayResolutions);
        await persistOptimizedItems(day.id, tripId, updatedItems);
        appliedCount += dayResolutions.length;
      }
    }

    return { success: true, appliedCount };
  }

  // ============================================================================
  // Private Weather-Itinerary Logic Helpers
  // ============================================================================

  public isOutdoorActivity(item: ItineraryItem): boolean {
    const text = `${item.title} ${item.category}`.toLowerCase();

    // Sights explicitly classified as indoor or all-weather are not outdoor
    if (
      text.includes("museum") ||
      text.includes("gallery") ||
      text.includes("basilica") ||
      text.includes("indoor") ||
      text.includes("mall")
    ) {
      return false;
    }

    if (item.category === "food" || item.category === "lodging" || item.category === "rest") {
      return false;
    }

    // Explicit beach, outdoor, park, viewpoints, fort grounds
    if (
      text.includes("beach") ||
      text.includes("fort") ||
      text.includes("viewpoint") ||
      text.includes("hill") ||
      text.includes("trek") ||
      text.includes("park") ||
      text.includes("garden") ||
      text.includes("paragliding") ||
      text.includes("valley") ||
      item.category === "sightseeing" ||
      item.category === "activity"
    ) {
      return true;
    }

    return false;
  }

  public isAdverseWeather(weather: HourlyWeather): boolean {
    if (weather.precipitationProbability >= 50) return true;
    if (weather.precipitation >= 2.0) return true;

    const c = weather.condition.toLowerCase();
    if (
      c.includes("rain") ||
      c.includes("thunderstorm") ||
      c.includes("drizzle") ||
      c.includes("downpour") ||
      c.includes("snow")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Finds an alternative dry time slot on the same day for an outdoor activity.
   * Example: Rain at 3 PM -> Move to 5 PM (17:00 - 18:30)
   */
  private findDryTimeWindow(
    item: ItineraryItem,
    day: DayItineraryData,
    hourlyLookup: Map<number, HourlyWeather>
  ): { start: string; end: string; rainProbability: number } | null {
    const durationMins = item.visit_minutes;
    const durationHours = Math.ceil(durationMins / 60);

    // Candidate daytime start hours (09:00 to 17:30)
    const candidateStartHours = [17, 16, 11, 10, 9, 15, 14];

    for (const h of candidateStartHours) {
      if (h === parseInt(item.start_time.split(":")[0], 10)) {
        continue; // Don't pick the same starting hour
      }

      // Check if weather is dry for the entire duration
      let isDry = true;
      let maxRainProb = 0;
      for (let offset = 0; offset < durationHours; offset++) {
        const checkH = h + offset;
        const w = hourlyLookup.get(checkH);
        if (w) {
          if (w.precipitationProbability > maxRainProb) {
            maxRainProb = w.precipitationProbability;
          }
          if (this.isAdverseWeather(w)) {
            isDry = false;
            break;
          }
        }
      }

      if (!isDry) continue;

      const newStart = `${h < 10 ? `0${h}` : `${h}`}:00`;
      const newEnd = addMinutesToTime(newStart, durationMins);

      // Check opening hours if present
      if (item.closing_time) {
        const closingMins = timeToMinutes(item.closing_time);
        const newEndMins = timeToMinutes(newEnd);
        if (newEndMins > closingMins) {
          continue; // Past closing time
        }
      }

      // Check if new window is reasonable within the day start/end
      const dayEndMins = timeToMinutes(day.day_end_time || "21:00");
      if (timeToMinutes(newEnd) > dayEndMins) {
        continue;
      }

      return {
        start: newStart,
        end: newEnd,
        rainProbability: maxRainProb,
      };
    }

    return null;
  }

  /**
   * Finds an indoor attraction to replace a rainy outdoor activity
   */
  private findIndoorReplacement(
    item: ItineraryItem,
    candidateIndoorAttractions: Attraction[],
    day: DayItineraryData
  ): Attraction | null {
    const currentAttractionIds = new Set(
      day.items.map((it) => it.attraction_id).filter(Boolean)
    );

    // Look for an indoor attraction not already visited on this day
    const available = candidateIndoorAttractions.filter(
      (a) => !currentAttractionIds.has(a.id)
    );

    if (available.length > 0) {
      return available[0];
    }

    // Fallback: check all DEMO_ATTRACTIONS for any indoor attraction
    const fallbackIndoor = DEMO_ATTRACTIONS.find(
      (a) =>
        (a.weather_suitability.toLowerCase().includes("indoor") ||
          a.weather_suitability.toLowerCase().includes("all weather")) &&
        !currentAttractionIds.has(a.id)
    );

    return fallbackIndoor || null;
  }

  private applyDayResolutions(
    items: ItineraryItem[],
    resolutions: WeatherConflictResolution[]
  ): ItineraryItem[] {
    const resMap = new Map(resolutions.map((r) => [r.itemId, r]));

    return items.map((item) => {
      const res = resMap.get(item.id);
      if (!res) return item;

      if (res.action === "reschedule_time" && res.newStartTime && res.newEndTime) {
        return {
          ...item,
          start_time: res.newStartTime,
          end_time: res.newEndTime,
        };
      }

      if (res.action === "replace_indoor" && res.replacementAttraction) {
        return {
          ...item,
          title: res.replacementAttraction.name,
          category: "sightseeing",
          attraction_id: res.replacementAttraction.id,
          estimated_cost: res.replacementAttraction.ticketPrice,
          opening_time: "09:30 AM",
          closing_time: "06:00 PM",
        };
      }

      return item;
    });
  }

  public async getCandidateIndoorAttractions(
    destinationId?: string
  ): Promise<Attraction[]> {
    if (!destinationId) {
      return DEMO_ATTRACTIONS.filter(
        (a) =>
          a.weather_suitability.toLowerCase().includes("indoor") ||
          a.weather_suitability.toLowerCase().includes("all weather")
      );
    }

    const all = await getDestinationAttractions(destinationId);
    return all.filter(
      (a) =>
        a.weather_suitability.toLowerCase().includes("indoor") ||
        a.weather_suitability.toLowerCase().includes("all weather")
    );
  }

  public resolveCoordinates(destinationQuery: string): {
    latitude: number;
    longitude: number;
    locationName: string;
    destinationId: string;
  } {
    const clean = (destinationQuery || "").trim().toLowerCase();
    const matched =
      DEMO_DESTINATIONS.find((d) => d.id.toLowerCase() === clean) ||
      DEMO_DESTINATIONS.find((d) => d.name.toLowerCase() === clean) ||
      DEMO_DESTINATIONS.find(
        (d) =>
          clean.includes(d.name.toLowerCase()) ||
          d.name.toLowerCase().includes(clean)
      ) ||
      DEMO_DESTINATIONS[0];

    return {
      latitude: matched.latitude,
      longitude: matched.longitude,
      locationName: matched.name,
      destinationId: matched.id,
    };
  }
}

export const weatherService = new WeatherService();
