import { NextResponse } from "next/server";
import { ragService } from "@/lib/services/rag-service";

export async function POST() {
  try {
    const result = await ragService.seedAuthoritativeDocs();
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.seededDocs} authoritative travel documents into pgvector`,
      ...result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to seed knowledge base";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
