import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { travelMemoryService } from "@/lib/services/travel-memory-service";
import { CreateMemoryInput } from "@/types/memories";

async function getActiveUser(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isMock = !supabaseUrl || supabaseUrl.includes("mock-project");

  if (isMock) {
    const id = req.cookies.get("rr_demo_session")?.value || "demo-user-123";
    return { id, email: "traveler@rimjhimroams.com" };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email || "" } : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await getActiveUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const memories = await travelMemoryService.getMemories(user.id);
    const summary = await travelMemoryService.getUserMemoriesSummary(user.id);

    return NextResponse.json({
      success: true,
      memories,
      summary,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load travel memories" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getActiveUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, category, keyword, notes, is_active } = body;

    if (!type || !["like", "avoid"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid memory type. Must be 'like' or 'avoid'." },
        { status: 400 }
      );
    }

    if (!category || !["destination", "hotel", "restaurant", "transit", "itinerary", "general"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid memory category." },
        { status: 400 }
      );
    }

    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return NextResponse.json(
        { error: "Memory keyword is required." },
        { status: 400 }
      );
    }

    const input: CreateMemoryInput = {
      type,
      category,
      keyword: keyword.trim(),
      notes: typeof notes === "string" ? notes.trim() : undefined,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    };

    const created = await travelMemoryService.createMemory(user.id, input);
    return NextResponse.json({ success: true, memory: created }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create travel memory" },
      { status: 400 }
    );
  }
}
