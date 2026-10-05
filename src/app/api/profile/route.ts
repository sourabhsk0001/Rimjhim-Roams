import { NextRequest, NextResponse } from "next/server";
import { getActiveUser } from "@/lib/auth/session";
import {
  getUserProfileData,
  updateUserProfileData,
} from "@/lib/services/profile-service";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "user_profile_get",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getActiveUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileData = await getUserProfileData(user.id, user.email);
  return NextResponse.json(profileData);
}

export async function PUT(req: NextRequest) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "user_profile_put",
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const user = await getActiveUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { profile = {}, traveller = {}, preferences = {} } = body;

    const result = await updateUserProfileData(
      user.id,
      profile,
      traveller,
      preferences
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
