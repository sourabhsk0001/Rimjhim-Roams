/**
 * Groq AI Travel Search Domain Types
 * Ultra-fast natural language travel search and intent extraction powered by Groq LPU inference.
 */

import { IndiaTourismLocation } from "./india-tourism";
import { NATMOCircuitDefinition } from "./recommendations";

export interface GroqSearchIntent {
  travelStyle: string; // e.g. "Coastal Relaxation", "Royal Heritage", "High-Altitude Trek"
  idealSeason: string; // e.g. "October to March", "Monsoon"
  estimatedBudgetTier: "budget" | "moderate" | "luxury";
  suggestedPace: "relaxed" | "moderate" | "fast";
  detectedRegions: string[];
  themes: string[];
}

export interface GroqSearchResult {
  query: string;
  model: string;
  aiSummary: string;
  intent: GroqSearchIntent;
  matchedLocations: IndiaTourismLocation[];
  matchedCircuits: NATMOCircuitDefinition[];
  suggestedFollowUps: string[];
  executionTimeMs: number;
  source: "groq_lpu" | "deterministic_engine";
}

export interface GroqSearchRequest {
  query: string;
  preferredState?: string;
  budgetTier?: "budget" | "moderate" | "luxury";
  limit?: number;
}
