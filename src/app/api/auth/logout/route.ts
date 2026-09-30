import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const isMock = !supabaseUrl || supabaseUrl.includes("mock-project");

    const response = NextResponse.json({ success: true });
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
