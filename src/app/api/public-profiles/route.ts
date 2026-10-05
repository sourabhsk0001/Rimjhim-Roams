import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { publicProfileService } from "@/lib/services/public-profile-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * GET /api/public-profiles
 * Public endpoint to list and search community explorer profiles.
 * Safe & RLS isolated: Only returns public non-PII attributes.
 */
export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "public_profiles_get",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const travelStyle = url.searchParams.get("travel_style") || undefined;
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const profiles = await publicProfileService.getPublicProfiles({
      search,
      travelStyle,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load public profiles" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/public-profiles
 * Authenticated endpoint: allows logged-in user to create or update their own public profile.
 * Rejects dirty data with 400 Bad Request.
 */
export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "public_profiles_post",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = await publicProfileService.upsertPublicProfile(userId, body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: result.profile }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to save public profile" },
      { status: 500 }
    );
  }
}
