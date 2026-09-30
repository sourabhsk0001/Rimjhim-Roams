import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTripBudgetDetails,
  addTripExpense,
  deleteTripExpense,
} from "@/lib/services/budget-service";
import { OptimizationProfile, BudgetCategory } from "@/types/budget";

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

  const { searchParams } = new URL(req.url);
  const profileParam = searchParams.get("profile") as OptimizationProfile | null;
  const profile: OptimizationProfile =
    profileParam &&
    ["Budget Saver", "Time Saver", "Experience Maximizer", "Balanced"].includes(
      profileParam
    )
      ? profileParam
      : "Balanced";

  const result = await getTripBudgetDetails(params.id, userId, profile);

  if (!result.success || !result.data) {
    return NextResponse.json(
      { error: result.error || "Failed to load budget details" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: result.data });
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
    const body = await req.json();
    const {
      category,
      title,
      amountMajor,
      currency,
      paidAt,
      paymentMethod,
      notes,
    } = body;

    const result = await addTripExpense(params.id, userId, {
      category: category as BudgetCategory,
      title,
      amountMajor: Number(amountMajor),
      currency,
      paidAt,
      paymentMethod,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, expense: result.data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getActiveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return NextResponse.json(
        { error: "expenseId parameter is required" },
        { status: 400 }
      );
    }

    const result = await deleteTripExpense(params.id, expenseId, userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete" },
      { status: 400 }
    );
  }
}
