import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
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
      const response = NextResponse.json({
        success: true,
        message: "Login successful (demo mode).",
        user: { id: "demo-user-123", email, fullName: "Demo Traveler" },
      });
      response.cookies.set("rr_demo_session", "demo-user-123", {
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
