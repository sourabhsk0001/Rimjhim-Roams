import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getUserProfileData,
  updateUserProfileData,
} from "@/lib/services/profile-service";

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

  const profileData = await getUserProfileData(user.id, user.email);
  return NextResponse.json(profileData);
}

export async function PUT(req: NextRequest) {
  const user = await getActiveUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { profile = {}, traveller = {}, preferences = {} } = body;

    const result = await updateUserProfileData(
      user.id,
      profile,
      traveller,
      preferences
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 }
    );
  }
}
