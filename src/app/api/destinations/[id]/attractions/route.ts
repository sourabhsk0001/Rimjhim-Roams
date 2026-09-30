import { NextRequest, NextResponse } from "next/server";
import { getDestinationAttractions } from "@/lib/services/travel-data-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attractions = await getDestinationAttractions(params.id);

    return NextResponse.json({
      data_status: "DEMO",
      count: attractions.length,
      attractions,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to retrieve attractions",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
