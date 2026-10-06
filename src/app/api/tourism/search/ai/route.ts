import { NextRequest, NextResponse } from "next/server";
import { groqSearchService } from "@/lib/services/groq-search-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

/**
 * GET & POST /api/tourism/search/ai
 * Ultra-fast Groq LPU powered natural-language travel search.
 * Extracts intent, synthesizes travel recommendations, and returns verified India Tourism places.
 */
export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "groq_search",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || searchParams.get("query");
    const preferredState = searchParams.get("state") || undefined;
    const budgetTier = searchParams.get("budget") as "budget" | "moderate" | "luxury" | undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 8;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "Query parameter 'q' is required." },
        { status: 400 }
      );
    }

    const result = await groqSearchService.search({
      query: query.trim(),
      preferredState,
      budgetTier,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI search error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "groq_search",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json().catch(() => ({}));
    const { query, preferredState, budgetTier, limit } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { success: false, error: "JSON field 'query' is required." },
        { status: 400 }
      );
    }

    const result = await groqSearchService.search({
      query: query.trim(),
      preferredState: typeof preferredState === "string" ? preferredState : undefined,
      budgetTier: ["budget", "moderate", "luxury"].includes(budgetTier) ? budgetTier : undefined,
      limit: typeof limit === "number" ? limit : 8,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI search error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
