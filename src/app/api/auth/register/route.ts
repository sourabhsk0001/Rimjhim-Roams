import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isMock = !supabaseUrl || supabaseUrl.includes("mock-project");

    if (isMock) {
      // Connect with persistent App Database
      const regResult = appDb.registerUser({
        email,
        password,
        fullName: fullName || email.split("@")[0],
      });

      if (!regResult.success || !regResult.user) {
        return NextResponse.json(
          { error: regResult.error || "Registration failed." },
          { status: 400 }
        );
      }

      const session = appDb.createSession(regResult.user.id);

      const response = NextResponse.json({
        success: true,
        message: "Registration successful. Welcome to TripWise AI!",
        user: regResult.user,
        session: { token: session.token, expires_at: session.expires_at },
      });

      // Set cookie for session persistence
      response.cookies.set("rr_demo_session", regResult.user.id, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
      });

      return response;
    }

    // Live Supabase integration
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Also sync to local database
    appDb.registerUser({
      email,
      password,
      fullName: fullName || email.split("@")[0],
    });

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal registration error" },
      { status: 500 }
    );
  }
}
