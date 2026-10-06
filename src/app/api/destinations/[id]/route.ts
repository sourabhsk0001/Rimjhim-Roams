import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/services/travel-data-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeErrorMessage } from "@/lib/security/sanitizer";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "destination_details",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const destination = await getDestinationById(params.id);
    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }
    return NextResponse.json({ destination });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Failed to fetch destination", details: sanitizeErrorMessage(err) },
      { status: 500 }
    );
  }
}
