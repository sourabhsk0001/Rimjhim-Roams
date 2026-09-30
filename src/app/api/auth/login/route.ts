import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, {
      prefix: "auth_login",
      maxRequests: 20,
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
      const demoId = email.toLowerCase().includes("demo")
        ? "demo-user-123"
        : `user-${Buffer.from(email).toString("hex").substring(0, 10)}`;

      const response = NextResponse.json({
        success: true,
        message: "Login successful (demo mode).",
        user: { id: demoId, email, fullName: "Demo Traveler" },
      });
      response.cookies.set("rr_demo_session", demoId, {
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
