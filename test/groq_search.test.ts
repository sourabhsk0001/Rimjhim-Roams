import test from "node:test";
import assert from "node:assert";
import { groqSearchService } from "@/lib/services/groq-search-service";
import { GroqModelProvider, getAIModelProvider } from "@/lib/ai/provider";
import { groqClient, GroqClient } from "@/lib/groq/client";
import { GET, POST } from "@/app/api/tourism/search/ai/route";
import { NextRequest } from "next/server";

test("Groq Search Service: Analyzes natural-language coastal query and surfaces Goa attractions", async () => {
  const result = await groqSearchService.search({
    query: "peaceful sunset beaches in Goa with light budget dining",
    budgetTier: "budget",
  });

  assert.ok(result, "Result should exist");
  assert.strictEqual(result.query, "peaceful sunset beaches in Goa with light budget dining");
  assert.ok(result.aiSummary && result.aiSummary.length > 20, "Should generate a descriptive summary");
  assert.ok(result.model.includes("llama-3.3-70b-versatile"), "Model should reference llama-3.3-70b-versatile");
  
  // Intent validation
  assert.strictEqual(result.intent.estimatedBudgetTier, "budget");
  assert.ok(
    result.intent.travelStyle.toLowerCase().includes("beach") ||
    result.intent.travelStyle.toLowerCase().includes("coastal"),
    `Travel style should be coastal/beach, got: ${result.intent.travelStyle}`
  );
  assert.ok(result.intent.detectedRegions.includes("Goa"), "Detected regions should include Goa");

  // Matched locations
  assert.ok(result.matchedLocations.length > 0, "Should match at least one location");
  const hasGoa = result.matchedLocations.some((loc) => loc.state.toLowerCase() === "goa");
  assert.ok(hasGoa, "Should match Goa locations");

  // Follow-ups
  assert.ok(result.suggestedFollowUps.length >= 2, "Should provide suggested follow-ups");
  assert.ok(result.executionTimeMs >= 0, "Execution time should be tracked");
});

test("Groq Search Service: Analyzes royal heritage query and matches Rajasthan forts & circuits", async () => {
  const result = await groqSearchService.search({
    query: "royal palaces and historic forts in Rajasthan",
    preferredState: "Rajasthan",
    budgetTier: "luxury",
  });

  assert.ok(result, "Result should exist");
  assert.strictEqual(result.intent.estimatedBudgetTier, "luxury");
  assert.ok(
    result.intent.travelStyle.toLowerCase().includes("heritage") ||
    result.intent.travelStyle.toLowerCase().includes("palace") ||
    result.intent.travelStyle.toLowerCase().includes("culture"),
    `Travel style should match heritage, got: ${result.intent.travelStyle}`
  );
  assert.ok(result.intent.detectedRegions.includes("Rajasthan"), "Should identify Rajasthan");

  // Matched locations should include forts/palaces
  assert.ok(result.matchedLocations.length > 0, "Should match locations");
  const hasFort = result.matchedLocations.some(
    (loc) => loc.name.toLowerCase().includes("fort") || loc.name.toLowerCase().includes("palace") || loc.state === "Rajasthan"
  );
  assert.ok(hasFort, "Should match fort or palace locations in Rajasthan");

  // Matched circuits should include Golden Triangle or Desert Triangle
  assert.ok(result.matchedCircuits.length > 0, "Should match at least one NATMO circuit");
  const circuitNames = result.matchedCircuits.map((c) => c.name.toLowerCase()).join(" ");
  assert.ok(
    circuitNames.includes("triangle") || circuitNames.includes("desert") || circuitNames.includes("golden"),
    `Should match appropriate heritage circuit, got: ${circuitNames}`
  );
});

test("Groq Search Service: Rejects empty query with descriptive validation error", async () => {
  await assert.rejects(
    async () => {
      await groqSearchService.search({ query: "   " });
    },
    {
      name: "Error",
      message: "Search query cannot be empty.",
    }
  );
});

test("Groq API Route: GET /api/tourism/search/ai and POST /api/tourism/search/ai handlers return valid JSON", async () => {
  // GET test
  const getReq = new NextRequest("http://localhost:3000/api/tourism/search/ai?q=Darjeeling%20tea%20gardens");
  const getRes = await GET(getReq);
  assert.strictEqual(getRes.status, 200);
  const getData = await getRes.json();
  assert.strictEqual(getData.success, true);
  assert.ok(getData.aiSummary);
  assert.ok(getData.matchedLocations.length > 0);

  // POST test
  const postReq = new NextRequest("http://localhost:3000/api/tourism/search/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "mountain trails and snow peaks in Himachal Pradesh",
      budgetTier: "moderate",
    }),
  });
  const postRes = await POST(postReq);
  assert.strictEqual(postRes.status, 200);
  const postData = await postRes.json();
  assert.strictEqual(postData.success, true);
  assert.strictEqual(postData.intent.estimatedBudgetTier, "moderate");
  assert.ok(postData.matchedLocations.length > 0);
});

test("Groq Client: Config validation and model resolution", () => {
  const customClient = new GroqClient("llama-3.1-8b-instant");
  assert.strictEqual(customClient.defaultModel, "llama-3.1-8b-instant");

  // When API key is not configured, isConfigured() is false
  const originalKey = process.env.GROQ_API_KEY;
  try {
    delete process.env.GROQ_API_KEY;
    assert.strictEqual(customClient.isConfigured(), false);
  } finally {
    if (originalKey !== undefined) {
      process.env.GROQ_API_KEY = originalKey;
    }
  }
});

test("GroqModelProvider: Requires API key and integrates with AI provider registry", () => {
  // Missing key throws
  assert.throws(
    () => {
      new GroqModelProvider("");
    },
    {
      name: "Error",
      message: "GROQ_API_KEY environment variable is required for GroqModelProvider.",
    }
  );

  // Providing a key instantiates provider
  const provider = new GroqModelProvider("gsk_mock_test_key_12345");
  assert.ok(provider.name.includes("Groq LPU"));
  assert.ok(provider.name.includes("llama-3.3-70b-versatile"));

  // getAIModelProvider fallback behavior when no keys are set
  const fallback = getAIModelProvider("groq");
  assert.ok(fallback.name, "Fallback provider should be returned");
});
