import { NextRequest, NextResponse } from "next/server";
import { appDb } from "@/lib/db/app-db";
import { resolveActiveUser } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, {
      prefix: "auth_me",
      maxRequests: 60,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const user = await resolveActiveUser(req);

    if (user) {
      const profile = appDb.getProfile(user.id);
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
        profile,
      });
    }

    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error fetching session" },
      { status: 500 }
    );
  }
}
