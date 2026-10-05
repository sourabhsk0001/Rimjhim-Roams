import { NextRequest } from "next/server";
import { createClient, isSupabaseLive } from "@/lib/supabase/server";
import { appDb } from "@/lib/db/app-db";

export async function getActiveUserId(req: NextRequest): Promise<string | null> {
  // 1. Try active live Supabase session
  if (isSupabaseLive()) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        return user.id;
      }
    } catch {
      // Non-fatal fallback
    }
  }

  // 2. Check local session cookie (supports demo accounts, persistent appDb users, and SSR session token)
  const sessionUserId = req.cookies.get("rr_demo_session")?.value;
  if (sessionUserId) {
    return sessionUserId;
  }

  // 3. In offline / test mode fallback to demo user
  if (!isSupabaseLive()) {
    return "demo-user-123";
  }

  return null;
}

export async function getActiveUser(
  req: NextRequest
): Promise<{ id: string; email: string; fullName?: string } | null> {
  // 1. Try active live Supabase user
  if (isSupabaseLive()) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name || user.email?.split("@")[0],
        };
      }
    } catch {
      // Non-fatal
    }
  }

  // 2. Check local session cookie
  const sessionUserId = req.cookies.get("rr_demo_session")?.value;
  if (sessionUserId) {
    const user = appDb.findUserById(sessionUserId);
    if (user) {
      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
      };
    }
    return {
      id: sessionUserId,
      email: "traveler@tripwise.ai",
      fullName: "TripWise Traveler",
    };
  }

  // 3. In offline / test mode fallback
  if (!isSupabaseLive()) {
    return {
      id: "demo-user-123",
      email: "traveler@tripwise.ai",
      fullName: "Demo Traveler",
    };
  }

  return null;
}
