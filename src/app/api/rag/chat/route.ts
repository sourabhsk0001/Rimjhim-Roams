import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/lib/services/rag-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { question, destination, category, minSimilarity } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const response = await ragService.askTravelAssistant(question.trim(), {
      destination: typeof destination === "string" ? destination : undefined,
      category: typeof category === "string" ? category : undefined,
      minSimilarity: typeof minSimilarity === "number" ? minSimilarity : undefined,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "RAG assistant evaluation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
