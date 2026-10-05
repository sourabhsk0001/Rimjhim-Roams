import { NextRequest, NextResponse } from "next/server";
import { recommendationEngineService } from "@/lib/services/recommendation-engine-service";
import { requireAuth } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "onboarding_get",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const profile = recommendationEngineService.getUserPreferences(auth.user.id);

    return NextResponse.json({
      success: true,
      onboarding_completed: profile.onboarding_completed,
      profile,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user onboarding preferences",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "onboarding_post",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();

    const updatedProfile = recommendationEngineService.saveOnboardingPreferences(
      auth.user.id,
      body
    );

    return NextResponse.json({
      success: true,
      message: "Preferences successfully saved.",
      profile: updatedProfile,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save onboarding preferences",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
