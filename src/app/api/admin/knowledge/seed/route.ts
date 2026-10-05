import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/lib/services/rag-service";
import { requireAdmin } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "admin_seed",
    maxRequests: 5,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

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
