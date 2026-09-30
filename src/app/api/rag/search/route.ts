import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/lib/services/rag-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, destination, category, minSimilarity, limit } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const results = await ragService.searchKnowledge(query.trim(), {
      destination: typeof destination === "string" ? destination : undefined,
      category: typeof category === "string" ? category : undefined,
      minSimilarity: typeof minSimilarity === "number" ? minSimilarity : undefined,
      limit: typeof limit === "number" ? limit : undefined,
    });

    return NextResponse.json({
      success: true,
      query: query.trim(),
      count: results.length,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
