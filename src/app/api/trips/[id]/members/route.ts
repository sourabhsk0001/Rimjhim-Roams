import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { collaborationService } from "@/lib/services/collaboration-service";


export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [membersRes, invitationsRes] = await Promise.all([
    collaborationService.getTripMembers(params.id, userId),
    collaborationService.getTripInvitations(params.id, userId),
  ]);

  if (!membersRes.success) {
    return NextResponse.json({ error: membersRes.error }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    members: membersRes.members,
    invitations: invitationsRes.invitations,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, targetUserId, role = "editor" } = body;

    if (email) {
      const result = await collaborationService.createInvitation(
        params.id,
        userId,
        email,
        role
      );
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, invitation: result.invitation });
    }

    if (targetUserId) {
      const result = await collaborationService.addTripMember(
        params.id,
        userId,
        targetUserId,
        role
      );
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, member: result.member });
    }

    return NextResponse.json(
      { error: "Must provide either email (for invitation) or targetUserId." },
      { status: 400 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to invite member" },
      { status: 500 }
    );
  }
}
