import { NextRequest, NextResponse } from "next/server";
import { getDestinationTransport } from "@/lib/services/travel-data-service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { transport, taxis } = await getDestinationTransport(params.id);

    return NextResponse.json({
      data_status: "DEMO",
      transport_count: transport.length,
      taxi_count: taxis.length,
      transport,
      taxis,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to retrieve transport options",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
