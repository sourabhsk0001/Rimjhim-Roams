import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { appDb } from "@/lib/db/app-db";

export async function POST(req: NextRequest) {
  try {
    const sessionUserId = req.cookies.get("rr_demo_session")?.value;
    if (sessionUserId) {
      appDb.deleteSession(sessionUserId);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isMock = !supabaseUrl || supabaseUrl.includes("mock-project");

    const response = NextResponse.json({ success: true, message: "Logged out successfully." });
    response.cookies.delete("rr_demo_session");

    if (!isMock) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }

    return response;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Logout error" },
      { status: 500 }
    );
  }
}
