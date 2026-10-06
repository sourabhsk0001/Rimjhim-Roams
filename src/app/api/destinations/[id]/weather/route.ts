import { NextRequest, NextResponse } from "next/server";
import { getDestinationById } from "@/lib/services/travel-data-service";
import { openMeteoWeatherProvider } from "@/lib/weather/provider";
import { enforceRateLimit } from "@/lib/security/rate-limiter";
import { sanitizeErrorMessage } from "@/lib/security/sanitizer";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rateLimitResponse = enforceRateLimit(req, {
    prefix: "destination_weather",
    maxRequests: 60,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const destination = await getDestinationById(params.id);
    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const days = daysParam ? Math.min(16, Math.max(1, parseInt(daysParam, 10))) : 7;

    const forecast = await openMeteoWeatherProvider.getForecast(
      destination.latitude,
      destination.longitude,
      days,
      destination.name
    );

    return NextResponse.json({
      success: true,
      destination: {
        id: destination.id,
        name: destination.name,
        state_province: destination.state_province,
        country: destination.country,
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
      forecast,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to fetch weather forecast",
        details: sanitizeErrorMessage(err),
      },
      { status: 500 }
    );
  }
}
