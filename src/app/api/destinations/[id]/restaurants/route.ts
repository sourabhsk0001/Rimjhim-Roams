import { NextRequest, NextResponse } from "next/server";
import { getDestinationRestaurants } from "@/lib/services/travel-data-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const restaurants = await getDestinationRestaurants(params.id);

    return NextResponse.json({
      data_status: "DEMO",
      count: restaurants.length,
      restaurants,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to retrieve restaurants",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
