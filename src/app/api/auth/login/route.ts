import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseLive } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limiter";
import { appDb } from "@/lib/db/app-db";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, {
      prefix: "auth_login",
      maxRequests: 30,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const liveSupabase = isSupabaseLive();

    // 1. Built-in demo accounts check (ensures demo buttons ALWAYS work reliably, even when live Supabase is connected)
    const isDemoAccount =
      (normalizedEmail === "demo@tripwise.ai" && password === "password123") ||
      (normalizedEmail === "admin@tripwise.ai" && password === "admin123");

    if (isDemoAccount) {
      const demoUserId = normalizedEmail === "admin@tripwise.ai" ? "admin-user-001" : "demo-user-123";
      let user = appDb.findUserById(demoUserId);
      if (!user) {
        user = appDb.findUserByEmail(normalizedEmail);
      }
      if (user) {
        const session = appDb.createSession(user.id);
        const response = NextResponse.json({
          success: true,
          message: "Demo login successful. Welcome to TripWise AI!",
          user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
          session: { token: session.token, expires_at: session.expires_at },
        });
        response.cookies.set("rr_demo_session", user.id, {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }
    }

    // 2. If live Supabase is configured, attempt authentication with Supabase Auth
    let supabaseAuthUser: { id: string; email?: string; user_metadata?: { full_name?: string } } | null = null;
    let supabaseSession: unknown = null;
    let supabaseError: { message: string } | null = null;

    if (liveSupabase) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          supabaseError = error;
        } else if (data?.user) {
          supabaseAuthUser = data.user;
          supabaseSession = data.session;
        }
      } catch (err: unknown) {
        supabaseError = { message: err instanceof Error ? err.message : "Supabase connection error" };
      }
    }

    // 3. If Supabase succeeded, sync user to appDb and return successful session
    if (supabaseAuthUser) {
      const existingUser = appDb.findUserByEmail(normalizedEmail);
      if (!existingUser) {
        appDb.registerUser({
          email: normalizedEmail,
          password,
          fullName: supabaseAuthUser.user_metadata?.full_name || normalizedEmail.split("@")[0],
          role: "traveler",
        });
      }

      const session = appDb.createSession(supabaseAuthUser.id);
      const response = NextResponse.json({
        success: true,
        message: "Login successful with Supabase!",
        user: {
          id: supabaseAuthUser.id,
          email: supabaseAuthUser.email || normalizedEmail,
          fullName: supabaseAuthUser.user_metadata?.full_name || normalizedEmail.split("@")[0],
          role: "traveler",
        },
        session: supabaseSession || { token: session.token, expires_at: session.expires_at },
      });

      response.cookies.set("rr_demo_session", supabaseAuthUser.id, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 4. Fallback / Synchronized Local App Database Check
    // If Supabase was not connected OR failed with Invalid Credentials / Email Not Confirmed,
    // verify whether this user exists in our local persistent database
    const localAuth = appDb.verifyCredentials(normalizedEmail, password);
    if (localAuth.success && localAuth.user) {
      // User is verified in appDb!
      // If live Supabase is active and failed because user wasn't registered in Supabase yet,
      // seamlessly auto-provision their account into Supabase in background
      if (liveSupabase && supabaseError && supabaseError.message?.toLowerCase().includes("invalid login credentials")) {
        try {
          const supabase = createClient();
          await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
              data: { full_name: localAuth.user.full_name },
            },
          });
        } catch {
          // Non-blocking auto-sync
        }
      }

      const session = appDb.createSession(localAuth.user.id);
      const response = NextResponse.json({
        success: true,
        message: "Login successful. Welcome back!",
        user: localAuth.user,
        session: { token: session.token, expires_at: session.expires_at },
      });

      response.cookies.set("rr_demo_session", localAuth.user.id, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    // 5. If credentials failed everywhere, provide a clear, informative error
    if (supabaseError) {
      const msg = supabaseError.message || "Invalid email or password.";
      return NextResponse.json(
        { error: msg },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: localAuth.error || "Invalid email or password. Please check your credentials or register a new account." },
      { status: 401 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal login error" },
      { status: 500 }
    );
  }
}
