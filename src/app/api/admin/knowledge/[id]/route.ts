import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/lib/services/rag-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await ragService.getDocumentById(params.id);
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, document });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to get document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const updated = await ragService.updateDocument(params.id, body);
    return NextResponse.json({ success: true, document: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await ragService.deleteDocument(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "Document and chunks deleted" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
