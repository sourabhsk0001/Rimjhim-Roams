import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/services/travel-data-service";
import { sanitizeErrorMessage } from "@/lib/security/sanitizer";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const destination = await getDestinationById(params.id);

    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data_status: "DEMO",
      destination,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to retrieve destination",
        details: sanitizeErrorMessage(err),
      },
      { status: 500 }
    );
  }
}
