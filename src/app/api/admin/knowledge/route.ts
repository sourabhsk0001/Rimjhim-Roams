import { NextRequest, NextResponse } from "next/server";
import { ragService } from "@/lib/services/rag-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const destination = searchParams.get("destination") || undefined;
    const category = searchParams.get("category") || undefined;

    const documents = await ragService.listDocuments(query, destination, category);
    return NextResponse.json({ success: true, count: documents.length, documents });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch knowledge documents";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, content, source, destination, category, metadata } = body;

    if (!title || !content || !source) {
      return NextResponse.json(
        { error: "title, content, and source are required." },
        { status: 400 }
      );
    }

    const document = await ragService.createDocument({
      title,
      content,
      source,
      destination,
      category,
      metadata,
    });

    return NextResponse.json({ success: true, document }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create knowledge document";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
