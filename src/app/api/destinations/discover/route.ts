import { NextRequest, NextResponse } from "next/server";
import { destinationDiscoveryEngine } from "@/lib/services/destination-discovery-engine";
import { DestinationDiscoveryInput } from "@/types/discovery";

/**
 * POST /api/destinations/discover
 * Finds feasible travel destinations based on origin, budget, duration,
 * traveller profile, and preferences.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DestinationDiscoveryInput>;

    if (!body.origin || !body.origin.trim()) {
      return NextResponse.json(
        { error: "Origin location is required (e.g. Kolkata, Delhi, Mumbai)." },
        { status: 400 }
      );
    }

    const input: DestinationDiscoveryInput = {
      origin: body.origin.trim(),
      budget: typeof body.budget === "number" ? body.budget : 20000,
      currency: body.currency || "INR",
      durationDays: typeof body.durationDays === "number" ? body.durationDays : 4,
      travellerCount: typeof body.travellerCount === "number" ? body.travellerCount : 2,
      travellerType: body.travellerType || "friends",
      preferences: body.preferences || ["Nature", "Adventure"],
    };

    const discoveryResult = await destinationDiscoveryEngine.discoverDestinations(input);

    return NextResponse.json(discoveryResult);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to discover destinations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
