import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { groupPollService } from "@/lib/services/group-poll-service";


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
