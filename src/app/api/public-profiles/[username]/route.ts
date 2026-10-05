import { NextRequest, NextResponse } from "next/server";
import { publicProfileService } from "@/lib/services/public-profile-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

/**
 * GET /api/public-profiles/[username]
 * Public endpoint to view a specific community profile by unique username.
 * Returns 404 if profile is not found or is marked private.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "public_profile_detail",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { username } = params;
    if (!username) {
      return NextResponse.json({ success: false, error: "Username parameter is required." }, { status: 400 });
    }

    const profile = await publicProfileService.getPublicProfileByUsername(username);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: `Explorer profile with username '${username}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load public profile" },
      { status: 500 }
    );
  }
}
