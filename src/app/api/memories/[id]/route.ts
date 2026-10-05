import { NextRequest, NextResponse } from "next/server";
import { getActiveUser } from "@/lib/auth/session";
import { travelMemoryService } from "@/lib/services/travel-memory-service";
import { UpdateMemoryInput } from "@/types/memories";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getActiveUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const memory = await travelMemoryService.getMemoryById(params.id, user.id);
    if (!memory) {
      return NextResponse.json({ error: "Travel memory not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, memory });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to retrieve travel memory" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getActiveUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const input: UpdateMemoryInput = {
      type: body.type,
      category: body.category,
      keyword: body.keyword,
      notes: body.notes,
      is_active: body.is_active,
    };

    const updated = await travelMemoryService.updateMemory(params.id, user.id, input);
    return NextResponse.json({ success: true, memory: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update travel memory" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getActiveUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await travelMemoryService.deleteMemory(params.id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Memory not found or already deleted" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Travel memory permanently deleted." });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete travel memory" },
      { status: 400 }
    );
  }
}
