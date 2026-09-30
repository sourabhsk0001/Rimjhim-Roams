import { NextRequest, NextResponse } from "next/server";
import { getDestinationHotels } from "@/lib/services/travel-data-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hotels = await getDestinationHotels(params.id);

    return NextResponse.json({
      data_status: "DEMO",
      count: hotels.length,
      hotels,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to retrieve hotels",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
