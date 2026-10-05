import { NextRequest, NextResponse } from "next/server";
import { getActiveUserId } from "@/lib/auth/session";
import { replanEngine } from "@/lib/engines/replan-engine";


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
    const dayNumber = typeof body.dayNumber === "number" ? body.dayNumber : 1;
    const delayMinutes = typeof body.delayMinutes === "number" ? body.delayMinutes : undefined;
    const currentTime = typeof body.currentTime === "string" ? body.currentTime : undefined;
    const currentLocation = body.currentLocation;
    const completedItemIds = Array.isArray(body.completedItemIds) ? body.completedItemIds : undefined;
    const apply = Boolean(body.apply);

    const result = await replanEngine.replanDay({
      tripId: params.id,
      dayNumber,
      currentTime,
      delayMinutes,
      currentLocation,
      completedItemIds,
      apply,
      userId,
    });

    if (!result.success && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to replan day schedule" },
      { status: 500 }
    );
  }
}
