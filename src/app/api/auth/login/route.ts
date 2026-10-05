import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isMock = !supabaseUrl || supabaseUrl.includes("mock-project");

    if (isMock) {
      // Connect and authenticate with the persistent App Database
      const authResult = appDb.verifyCredentials(email, password);

      if (!authResult.success || !authResult.user) {
        // Special demo fallback if someone tests with demo accounts
        if (email.toLowerCase().includes("demo") && password === "password123") {
          const user = appDb.findUserById("demo-user-123");
          if (user) {
            const session = appDb.createSession(user.id);
            const response = NextResponse.json({
              success: true,
              message: "Login successful.",
              user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
              session: { token: session.token, expires_at: session.expires_at },
            });
            response.cookies.set("rr_demo_session", user.id, {
              path: "/",
              httpOnly: false,
              sameSite: "lax",
            });
            return response;
          }
        }

        const statusCode = authResult.error?.includes("No account") ? 404 : 401;
        return NextResponse.json(
          { error: authResult.error || "Login failed. Please check your credentials." },
          { status: statusCode }
        );
      }

      const session = appDb.createSession(authResult.user.id);

      const response = NextResponse.json({
        success: true,
        message: "Login successful. Welcome back!",
        user: authResult.user,
        session: { token: session.token, expires_at: session.expires_at },
      });

      response.cookies.set("rr_demo_session", authResult.user.id, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
      });

      return response;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal login error" },
      { status: 500 }
    );
  }
}
