import { NextRequest, NextResponse } from "next/server";
import { appDb } from "@/lib/db/app-db";
import { createClient, isSupabaseLive } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const sessionUserId = req.cookies.get("rr_demo_session")?.value;

    if (sessionUserId) {
      const user = appDb.findUserById(sessionUserId);
      const profile = appDb.getProfile(sessionUserId);
      if (user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
          },
          profile,
        });
      }
    }

    if (isSupabaseLive()) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const profile = appDb.getProfile(user.id);
          return NextResponse.json({
            authenticated: true,
            user: {
              id: user.id,
              email: user.email,
              fullName: user.user_metadata?.full_name || user.email?.split("@")[0],
              role: "traveler",
            },
            profile,
          });
        }
      } catch {
        // Non-fatal if Supabase check fails
      }
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
