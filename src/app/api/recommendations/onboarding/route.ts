import { NextRequest, NextResponse } from "next/server";
import { recommendationEngineService } from "@/lib/services/recommendation-engine-service";

function resolveUserId(req: NextRequest): string {
  return (
    req.cookies.get("rr_demo_session")?.value ||
    req.headers.get("x-user-id") ||
    "demo-user-123"
  );
}

export async function GET(req: NextRequest) {
  try {
    const userId = resolveUserId(req);
    const profile = recommendationEngineService.getUserPreferences(userId);

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
  try {
    const userId = resolveUserId(req);
    const body = await req.json();

    const updatedProfile = recommendationEngineService.saveOnboardingPreferences(
      userId,
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
