import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { expenseSplittingService } from "@/lib/services/expense-splitting-service";

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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await expenseSplittingService.getTripExpenses(params.id, userId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  return NextResponse.json({ success: true, expenses: result.expenses });
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
    const {
      title,
      description,
      category = "other",
      amount_minor_units,
      currency = "INR",
      split_type = "equal",
      participants,
      paid_by = userId,
      paid_at,
    } = body;

    const result = await expenseSplittingService.createSplitExpense(
      {
        trip_id: params.id,
        paid_by,
        title,
        description,
        category,
        amount_minor_units: Number(amount_minor_units),
        currency,
        split_type,
        participants: Array.isArray(participants) ? participants : [],
        paid_at,
      },
      userId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, expense: result.expense });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create expense" },
      { status: 500 }
    );
  }
}
