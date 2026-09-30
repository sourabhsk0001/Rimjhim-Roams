import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { collaborationService } from "@/lib/services/collaboration-service";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { role } = body;
    if (!role || !["owner", "editor", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified." }, { status: 400 });
    }

    const result = await collaborationService.updateTripMemberRole(
      params.id,
      userId,
      params.memberId,
      role
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update member role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await collaborationService.removeTripMember(
      params.id,
      userId,
      params.memberId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to remove member" },
      { status: 500 }
    );
  }
}
