import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { documentService } from "@/lib/services/document-service";

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

/**
 * GET /api/trips/[id]/documents
 * Lists all travel documents for an authorized trip with signed download/view URLs.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripId = params.id;
    const result = await documentService.listTripDocuments(tripId, userId);

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      documents: result.documents,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/trips/[id]/documents
 * Registers uploaded document metadata (tickets, hotel confirmations, activity vouchers, other).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getActiveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tripId = params.id;
    const body = await req.json();

    if (!body.name || !body.document_type || !body.file_path) {
      return NextResponse.json(
        { error: "name, document_type, and file_path are required" },
        { status: 400 }
      );
    }

    const result = await documentService.createDocumentRecord(
      tripId,
      userId,
      {
        name: body.name,
        document_type: body.document_type,
        file_path: body.file_path,
        file_size: body.file_size || 0,
        mime_type: body.mime_type || "application/pdf",
        notes: body.notes,
      }
    );

    if (!result.authorized) {
      return NextResponse.json({ error: result.error || "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ success: true, document: result.document }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
