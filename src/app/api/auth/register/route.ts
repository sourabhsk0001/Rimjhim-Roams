import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseLive } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limiter";
import { appDb } from "@/lib/db/app-db";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, {
      prefix: "auth_register",
      maxRequests: 25,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { email, password, fullName } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const cleanName = fullName?.trim() || normalizedEmail.split("@")[0];
    const liveSupabase = isSupabaseLive();

    // 1. Always register in persistent App Database (prevents duplicates & guarantees immediate session)
    const regResult = appDb.registerUser({
      email: normalizedEmail,
      password,
      fullName: cleanName,
    });

    if (!regResult.success && regResult.error?.includes("already exists")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400 }
      );
    }

    let supabaseUser: { id: string } | null = null;
    let supabaseSession: unknown = null;

    // 2. If live Supabase is configured, provision user in Supabase Auth
    if (liveSupabase) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: cleanName,
            },
          },
        });

        if (error) {
          console.warn("Supabase signUp notice:", error.message);
        } else if (data?.user) {
          supabaseUser = data.user;
          supabaseSession = data.session;
        }
      } catch (sbErr) {
        console.warn("Supabase connection notice during registration:", sbErr);
      }
    }

    const activeUser = regResult.user || {
      id: supabaseUser?.id || `user-${Date.now()}`,
      email: normalizedEmail,
      fullName: cleanName,
      role: "traveler",
    };

    const session = appDb.createSession(activeUser.id);

    const response = NextResponse.json({
      success: true,
      message: "Registration successful. Welcome to TripWise AI!",
      user: activeUser,
      session: supabaseSession || { token: session.token, expires_at: session.expires_at },
    });

    // Set cookie for instant authenticated session across Next.js middleware and pages
    response.cookies.set("rr_demo_session", activeUser.id, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal registration error" },
      { status: 500 }
    );
  }
}
