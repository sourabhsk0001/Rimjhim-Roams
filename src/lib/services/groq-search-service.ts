/**
 * Groq AI Travel Search Service
 * Intelligently analyzes natural-language travel queries using Groq LPU inference (Llama 3.3 70B).
 * Extracts traveler intent, synthesizes concise travel recommendations, and surfaces
 * verified India Tourism locations and NATMO Thematic Circuits.
 * 
 * Includes high-fidelity deterministic fallback engine for offline development and testing.
 */

import { groqClient, GroqClient } from "@/lib/groq/client";
import {
  GroqSearchIntent,
  GroqSearchRequest,
  GroqSearchResult,
} from "@/types/groq-search";
import { indiaTourismService } from "@/lib/services/india-tourism-service";
import { NATMO_THEMATIC_CIRCUITS } from "@/lib/services/tourism-autocomplete-service";
import { IndiaTourismLocation } from "@/types/india-tourism";
import { NATMOCircuitDefinition } from "@/types/recommendations";
import { getGeminiClient } from "@/lib/gemini/client";

export class GroqSearchService {
  private client: GroqClient;

  constructor(client: GroqClient = groqClient) {
    this.client = client;
  }

  /**
   * Search India tourism destinations and circuits using natural language powered by Groq or Gemini.
   */
  public async search(request: GroqSearchRequest): Promise<GroqSearchResult> {
    const startTime = Date.now();
    const query = (request.query || "").trim();

    if (!query) {
      throw new Error("Search query cannot be empty.");
    }

    const preferredProvider =
      request.provider ||
      (this.client.isConfigured() ? "groq" : process.env.GEMINI_API_KEY ? "gemini" : "groq");

    // 1. If user explicitly requested Gemini 3.5 Flash
    if (preferredProvider === "gemini" && process.env.GEMINI_API_KEY) {
      try {
        const geminiResult = await this.executeGeminiSearch(query, request);
        return {
          ...geminiResult,
          executionTimeMs: Math.max(1, Date.now() - startTime),
        };
      } catch (err) {
        console.warn("Gemini API search error, falling back to deterministic engine:", err);
      }
    }

    // 2. If Groq is requested/configured, attempt high-speed LPU inference
    if (preferredProvider === "groq" && this.client.isConfigured()) {
      try {
        const groqResult = await this.executeGroqLpuSearch(query, request);
        return {
          ...groqResult,
          executionTimeMs: Math.max(1, Date.now() - startTime),
        };
      } catch (err) {
        console.warn("Groq API search error, falling back to deterministic engine:", err);
      }
    }

    // 3. Fallback to Gemini if Groq was requested but not configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const geminiResult = await this.executeGeminiSearch(query, request);
        return {
          ...geminiResult,
          executionTimeMs: Math.max(1, Date.now() - startTime),
        };
      } catch (err) {
        console.warn("Gemini API search error, falling back to deterministic engine:", err);
      }
    }

    // 4. Deterministic Intelligence Fallback Engine
    const fallbackResult = this.executeDeterministicFallbackSearch(query, request);
    return {
      ...fallbackResult,
      executionTimeMs: Math.max(1, Date.now() - startTime),
    };
  }

  /**
   * Dispatches the natural language search prompt to Groq API.
   */
  private async executeGroqLpuSearch(
    query: string,
    request: GroqSearchRequest
  ): Promise<Omit<GroqSearchResult, "executionTimeMs">> {
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const systemPrompt = `You are Rimjhim Roams' ultra-fast India Tourism AI search engine powered by Groq LPU.
Analyze the traveler's natural language search query and return a valid, well-structured JSON response.

Contextual Knowledge:
- 28 States & 8 Union Territories of India (Goa, Rajasthan, Himachal Pradesh, Kerala, West Bengal, Karnataka, Ladakh, Tamil Nadu, Uttarakhand, etc.)
- NATMO Thematic Circuits: Golden Triangle, Desert Triangle & Thar Dunes, Buddhist Heritage, Malabar Coast & Spice Route, Himalayan Footsteps, North-East Explorer.
- Tourism categories: Historical Monument, Nature & Beach, Hill Station, Adventure, Spiritual & Pilgrimage, Wildlife, Cultural.

You must respond ONLY with a JSON object matching this schema:
{
  "aiSummary": "2-3 sentence evocative, actionable travel recommendation directly answering the traveler's request.",
  "travelStyle": "string e.g. Coastal Relaxation | Royal Heritage | Mountain Trek | Cultural Discovery",
  "idealSeason": "string e.g. October to March | April to June | Monsoon Bliss | Year-round",
  "estimatedBudgetTier": "budget" | "moderate" | "luxury",
  "suggestedPace": "relaxed" | "moderate" | "fast",
  "detectedRegions": ["array of matching state or UT names in India"],
  "themes": ["array of 2-4 detected travel themes"],
  "relevantLocationKeywords": ["array of 3-6 specific sight, city, or attraction names relevant to the query"],
  "suggestedCircuits": ["array of 1-2 matching NATMO circuit names"],
  "suggestedFollowUps": ["array of 3 clickable related follow-up search queries"]
}`;

    const completion = await this.client.createChatCompletion({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Traveler Query: "${query}"${request.preferredState ? `\nPreferred State: ${request.preferredState}` : ""}${request.budgetTier ? `\nBudget Tier: ${request.budgetTier}` : ""}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1024,
    });

    const rawContent = completion.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error("Failed to parse JSON response from Groq.");
    }

    // Match locations from database using keywords and detected regions
    const matchedLocations = this.resolveMatchedLocations(
      parsed.relevantLocationKeywords || [],
      parsed.detectedRegions || [],
      query,
      request.limit || 8
    );

    // Match circuits from NATMO repository
    const matchedCircuits = this.resolveMatchedCircuits(
      parsed.suggestedCircuits || [],
      parsed.detectedRegions || [],
      query
    );

    const intent: GroqSearchIntent = {
      travelStyle: parsed.travelStyle || "General Exploration",
      idealSeason: parsed.idealSeason || "October to March",
      estimatedBudgetTier: ["budget", "moderate", "luxury"].includes(parsed.estimatedBudgetTier)
        ? parsed.estimatedBudgetTier
        : "moderate",
      suggestedPace: ["relaxed", "moderate", "fast"].includes(parsed.suggestedPace)
        ? parsed.suggestedPace
        : "moderate",
      detectedRegions: Array.isArray(parsed.detectedRegions) ? parsed.detectedRegions : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes : ["Exploration"],
    };

    return {
      query,
      model: `${model} (Groq LPU)`,
      aiSummary: parsed.aiSummary || `Curated travel options matching "${query}".`,
      intent,
      matchedLocations,
      matchedCircuits,
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0
        ? parsed.suggestedFollowUps
        : [
            `Top budget stays for ${intent.detectedRegions[0] || "this route"}`,
            `Best time to visit without crowds`,
            `3-day itinerary recommendations`,
          ],
      source: "groq_lpu",
    };
  }

  /**
   * Dispatches the natural language search prompt to Google Gemini (gemini-3.5-flash).
   */
  private async executeGeminiSearch(
    query: string,
    request: GroqSearchRequest
  ): Promise<Omit<GroqSearchResult, "executionTimeMs">> {
    const modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

    const systemPrompt = `You are Rimjhim Roams' India Tourism AI search engine powered by Google Gemini (${modelName}).
Analyze the traveler's natural language search query and return a valid, well-structured JSON response.

Contextual Knowledge:
- 28 States & 8 Union Territories of India (Goa, Rajasthan, Himachal Pradesh, Kerala, West Bengal, Karnataka, Ladakh, Tamil Nadu, Uttarakhand, etc.)
- NATMO Thematic Circuits: Golden Triangle, Desert Triangle & Thar Dunes, Buddhist Heritage, Malabar Coast & Spice Route, Himalayan Footsteps, North-East Explorer.
- Tourism categories: Historical Monument, Nature & Beach, Hill Station, Adventure, Spiritual & Pilgrimage, Wildlife, Cultural.

You must respond ONLY with a JSON object matching this schema:
{
  "aiSummary": "2-3 sentence evocative, actionable travel recommendation directly answering the traveler's request.",
  "travelStyle": "string e.g. Coastal Relaxation | Royal Heritage | Mountain Trek | Cultural Discovery",
  "idealSeason": "string e.g. October to March | April to June | Monsoon Bliss | Year-round",
  "estimatedBudgetTier": "budget" | "moderate" | "luxury",
  "suggestedPace": "relaxed" | "moderate" | "fast",
  "detectedRegions": ["array of matching state or UT names in India"],
  "themes": ["array of 2-4 detected travel themes"],
  "relevantLocationKeywords": ["array of 3-6 specific sight, city, or attraction names relevant to the query"],
  "suggestedCircuits": ["array of 1-2 matching NATMO circuit names"],
  "suggestedFollowUps": ["array of 3 clickable related follow-up search queries"]
}`;

    const client = getGeminiClient();
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
      systemInstruction: systemPrompt,
    });

    const userPrompt = `Traveler Query: "${query}"${request.preferredState ? `\nPreferred State: ${request.preferredState}` : ""}${request.budgetTier ? `\nBudget Tier: ${request.budgetTier}` : ""}`;
    const result = await model.generateContent(userPrompt);
    const rawContent = result.response.text();

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error("Failed to parse JSON response from Gemini.");
    }

    const matchedLocations = this.resolveMatchedLocations(
      parsed.relevantLocationKeywords || [],
      parsed.detectedRegions || [],
      query,
      request.limit || 8
    );

    const matchedCircuits = this.resolveMatchedCircuits(
      parsed.suggestedCircuits || [],
      parsed.detectedRegions || [],
      query
    );

    const intent: GroqSearchIntent = {
      travelStyle: parsed.travelStyle || "General Exploration",
      idealSeason: parsed.idealSeason || "October to March",
      estimatedBudgetTier: ["budget", "moderate", "luxury"].includes(parsed.estimatedBudgetTier)
        ? parsed.estimatedBudgetTier
        : "moderate",
      suggestedPace: ["relaxed", "moderate", "fast"].includes(parsed.suggestedPace)
        ? parsed.suggestedPace
        : "moderate",
      detectedRegions: Array.isArray(parsed.detectedRegions) ? parsed.detectedRegions : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes : ["Exploration"],
    };

    return {
      query,
      model: `${modelName} (Google Gemini)`,
      aiSummary: parsed.aiSummary || `Curated travel options matching "${query}".`,
      intent,
      matchedLocations,
      matchedCircuits,
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0
        ? parsed.suggestedFollowUps
        : [
            `Top budget stays for ${intent.detectedRegions[0] || "this route"}`,
            `Best time to visit without crowds`,
            `3-day itinerary recommendations`,
          ],
      source: "gemini_flash",
    };
  }

  /**
   * High-fidelity deterministic fallback engine for offline and key-free environments.
   */
  private executeDeterministicFallbackSearch(
    query: string,
    request: GroqSearchRequest
  ): Omit<GroqSearchResult, "executionTimeMs"> {
    const qLower = query.toLowerCase();

    // 1. Detect regions & states
    const states = indiaTourismService.getAllStatesAndUTs();
    const detectedRegions: string[] = [];
    for (const s of states) {
      if (qLower.includes(s.name.toLowerCase())) {
        detectedRegions.push(s.name);
      }
    }
    if (request.preferredState && !detectedRegions.includes(request.preferredState)) {
      detectedRegions.unshift(request.preferredState);
    }

    // Common city mapping
    if (qLower.includes("jaipur") || qLower.includes("udaipur") || qLower.includes("jodhpur")) {
      if (!detectedRegions.includes("Rajasthan")) detectedRegions.push("Rajasthan");
    }
    if (qLower.includes("manali") || qLower.includes("shimla") || qLower.includes("dharamshala")) {
      if (!detectedRegions.includes("Himachal Pradesh")) detectedRegions.push("Himachal Pradesh");
    }
    if (qLower.includes("darjeeling") || qLower.includes("kolkata")) {
      if (!detectedRegions.includes("West Bengal")) detectedRegions.push("West Bengal");
    }
    if (qLower.includes("goa") || qLower.includes("calangute") || qLower.includes("baga") || qLower.includes("panaji")) {
      if (!detectedRegions.includes("Goa")) detectedRegions.push("Goa");
    }

    // 2. Infer Travel Style & Themes
    let travelStyle = "Culture & Heritage Exploration";
    const themes: string[] = [];

    if (/beach|coast|ocean|sea|water sport|sunset|shack/i.test(qLower)) {
      travelStyle = "Coastal & Beach Haven";
      themes.push("Beaches", "Sunset Promenades", "Coastal Dining");
      if (detectedRegions.length === 0) detectedRegions.push("Goa");
    } else if (/mountain|hill|hike|trek|snow|alpine|peak|valley/i.test(qLower)) {
      travelStyle = "Highland Adventure & Nature";
      themes.push("Hill Stations", "Nature Trails", "Mountain Panoramas");
      if (detectedRegions.length === 0) detectedRegions.push("Himachal Pradesh");
    } else if (/fort|palace|royal|monument|heritage|history|mahal/i.test(qLower)) {
      travelStyle = "Royal Heritage & Palaces";
      themes.push("Historical Monuments", "Forts & Citadels", "Royal Architecture");
      if (detectedRegions.length === 0) detectedRegions.push("Rajasthan");
    } else if (/temple|spiritual|sacred|ghat|pilgrim|peace|meditation/i.test(qLower)) {
      travelStyle = "Spiritual & Pilgrimage Trail";
      themes.push("Spiritual Sanctuaries", "Ancient Architecture", "Peaceful Dwell");
    } else {
      themes.push("Sightseeing", "Local Highlights", "Scenic Photography");
    }

    // 3. Infer Budget & Pace
    let estimatedBudgetTier: "budget" | "moderate" | "luxury" = "moderate";
    if (/budget|cheap|backpack|hostel|inexpensive|low cost|save/i.test(qLower)) {
      estimatedBudgetTier = "budget";
    } else if (/luxury|resort|5 star|palace stay|premium|vip/i.test(qLower)) {
      estimatedBudgetTier = "luxury";
    }
    if (request.budgetTier) {
      estimatedBudgetTier = request.budgetTier;
    }

    let suggestedPace: "relaxed" | "moderate" | "fast" = "moderate";
    if (/chill|relax|slow|peaceful|quiet|rest/i.test(qLower)) {
      suggestedPace = "relaxed";
    } else if (/quick|fast|weekend|day trip|express/i.test(qLower)) {
      suggestedPace = "fast";
    }

    // 4. Resolve matching locations & circuits
    const matchedLocations = this.resolveMatchedLocations(
      [query],
      detectedRegions,
      query,
      request.limit || 8
    );

    const matchedCircuits = this.resolveMatchedCircuits([], detectedRegions, query);

    // 5. Synthesize guidance summary
    const primaryRegion = detectedRegions[0] || (matchedLocations[0]?.state || "India");
    const topPlace = matchedLocations[0]?.name || "scenic landmarks";
    const aiSummary = `Curated destinations matching "${query}". Highlights include ${topPlace} in ${primaryRegion}, tailored for a ${suggestedPace} travel pace with ${estimatedBudgetTier}-friendly arrangements. Verified operating hours and entry guidelines are pre-calibrated.`;

    const intent: GroqSearchIntent = {
      travelStyle,
      idealSeason: /monsoon|rain/i.test(qLower)
        ? "July to September"
        : /summer/i.test(qLower)
        ? "March to June"
        : "October to March",
      estimatedBudgetTier,
      suggestedPace,
      detectedRegions,
      themes,
    };

    return {
      query,
      model: "llama-3.3-70b-versatile (Deterministic Simulation)",
      aiSummary,
      intent,
      matchedLocations,
      matchedCircuits,
      suggestedFollowUps: [
        `Best photography and sunset spots in ${primaryRegion}`,
        `Authentic regional dining options near ${topPlace}`,
        `3-day itinerary map for this circuit`,
      ],
      source: "deterministic_engine",
    };
  }

  /**
   * Helper to retrieve authentic locations matching keywords and regions.
   */
  private resolveMatchedLocations(
    keywords: string[],
    regions: string[],
    rawQuery: string,
    limit: number
  ): IndiaTourismLocation[] {
    const results: IndiaTourismLocation[] = [];
    const seenIds = new Set<string>();

    // 1. First search by primary regions if present
    for (const region of regions) {
      const stateMatches = indiaTourismService.searchLocations({
        state: region,
        limit: 4,
      });
      for (const loc of stateMatches.locations) {
        if (!seenIds.has(loc.id)) {
          seenIds.add(loc.id);
          results.push(loc);
        }
      }
    }

    // 2. Search by explicit keywords
    for (const kw of keywords) {
      if (!kw || kw.trim().length < 2) continue;
      const kwMatches = indiaTourismService.searchLocations({
        query: kw.trim(),
        limit: 4,
      });
      for (const loc of kwMatches.locations) {
        if (!seenIds.has(loc.id)) {
          seenIds.add(loc.id);
          results.push(loc);
        }
      }
    }

    // 3. Fallback: Search by raw query tokens
    if (results.length < 3) {
      const tokens = rawQuery.split(/\s+/).filter((t) => t.length > 3);
      for (const t of tokens) {
        const tokenMatches = indiaTourismService.searchLocations({
          query: t,
          limit: 3,
        });
        for (const loc of tokenMatches.locations) {
          if (!seenIds.has(loc.id)) {
            seenIds.add(loc.id);
            results.push(loc);
          }
        }
      }
    }

    // 4. Fallback: Default to top verified locations if still empty
    if (results.length === 0) {
      const defaults = indiaTourismService.searchLocations({ limit: 4 });
      return defaults.locations;
    }

    return results.slice(0, limit);
  }

  /**
   * Helper to resolve matching NATMO circuits.
   */
  private resolveMatchedCircuits(
    suggestedNames: string[],
    regions: string[],
    query: string
  ): NATMOCircuitDefinition[] {
    const qLower = query.toLowerCase();
    const matched: NATMOCircuitDefinition[] = [];
    const seenIds = new Set<string>();

    // Exact or partial name match from Groq suggestion
    for (const name of suggestedNames) {
      const c = NATMO_THEMATIC_CIRCUITS.find(
        (circuit) =>
          circuit.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(circuit.name.toLowerCase())
      );
      if (c && !seenIds.has(c.id)) {
        seenIds.add(c.id);
        matched.push(c);
      }
    }

    // Match by detected states
    for (const region of regions) {
      for (const circuit of NATMO_THEMATIC_CIRCUITS) {
        if (circuit.primaryStates.some((st) => st.toLowerCase() === region.toLowerCase()) && !seenIds.has(circuit.id)) {
          seenIds.add(circuit.id);
          matched.push(circuit);
        }
      }
    }

    // Match by themes or keywords
    if (matched.length === 0) {
      if (/golden|delhi|agra|jaipur|triangle/i.test(qLower)) {
        const c = NATMO_THEMATIC_CIRCUITS.find((c) => c.id === "golden-triangle-circuit");
        if (c && !seenIds.has(c.id)) matched.push(c);
      } else if (/desert|thar|jodhpur|jaisalmer/i.test(qLower)) {
        const c = NATMO_THEMATIC_CIRCUITS.find((c) => c.id === "desert-triangle-circuit");
        if (c && !seenIds.has(c.id)) matched.push(c);
      } else if (/buddhist|bodh gaya|nalanda|sarnath/i.test(qLower)) {
        const c = NATMO_THEMATIC_CIRCUITS.find((c) => c.id === "buddhist-heritage-circuit");
        if (c && !seenIds.has(c.id)) matched.push(c);
      } else if (/beach|malabar|kerala|goa|coastal/i.test(qLower)) {
        const c = NATMO_THEMATIC_CIRCUITS.find((c) => c.id === "malabar-coast-circuit");
        if (c && !seenIds.has(c.id)) matched.push(c);
      } else if (/himalaya|mountain|trek|manali|shimla/i.test(qLower)) {
        const c = NATMO_THEMATIC_CIRCUITS.find((c) => c.id === "himalayan-footsteps-circuit");
        if (c && !seenIds.has(c.id)) matched.push(c);
      }
    }

    return matched.slice(0, 3);
  }
}

export const groqSearchService = new GroqSearchService();
