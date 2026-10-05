import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseLive } from "@/lib/supabase/server";
import { appDb } from "@/lib/db/app-db";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, {
      prefix: "auth_logout",
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const sessionUserId = req.cookies.get("rr_demo_session")?.value;
    if (sessionUserId) {
      appDb.deleteSession(sessionUserId);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully." });

    // Explicitly expire session cookie across all paths
    response.cookies.set("rr_demo_session", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    if (isSupabaseLive()) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Non-fatal
      }
    }

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Logout error" },
      { status: 500 }
    );
  }
}
