import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groupPollService } from "@/lib/services/group-poll-service";

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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; pollId: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { optionId } = body;

    if (!optionId) {
      return NextResponse.json({ error: "optionId is required." }, { status: 400 });
    }

    const result = await groupPollService.castVote(
      params.id,
      params.pollId,
      userId,
      optionId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, poll: result.poll });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cast vote" },
      { status: 500 }
    );
  }
}
