import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { copilotService } from "@/lib/services/copilot-service";

async function getActiveUserId(req: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isMock = !supabaseUrl || supabaseUrl.includes("mock-project");

  if (isMock) {
    return req.cookies.get("rr_demo_session")?.value || "demo-user-123";
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? user.id : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/copilot/chat
 * Main conversational endpoint for TripWise AI Travel Copilot.
 * Ensures the model selects deterministic backend tools and does not do authoritative math.
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { message, tripId, history } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const response = await copilotService.processMessage(
      {
        message: message.trim(),
        tripId: typeof tripId === "string" ? tripId : undefined,
        history: Array.isArray(history) ? history : undefined,
      },
      userId
    );

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal copilot error";
    const status = message.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
