import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GEMINI_MODEL } from "@/lib/gemini/client";
import { enforceRateLimit } from "@/lib/security/rate-limiter";
import { requireAuth } from "@/lib/auth/session";
import { enforceGeminiQuota } from "@/lib/security/gemini-quota";

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(req, {
      prefix: "trips_generate",
      maxRequests: 25,
      windowMs: 60 * 1000,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const auth = await requireAuth(req);
    if (!auth.authorized) return auth.response;

    const quotaResponse = enforceGeminiQuota(req, auth.user.id);
    if (quotaResponse) return quotaResponse;

    const body = await req.json();
    const { destination, days = 3, budget = "moderate" } = body;

    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      // Graceful fallback for mock / development when API key is pending configuration
      return NextResponse.json({
        mock: true,
        message:
          "Gemini API key is not configured. Returning scaffolded trip preview.",
        plan: {
          destination,
          days,
          budget,
          itinerary: [
            {
              day: 1,
              title: `Arrival and Highlights of ${destination}`,
              activities: [
                {
                  time: "10:00 AM",
                  activity: `Explore central landmark in ${destination}`,
                  category: "attraction",
                },
                {
                  time: "01:00 PM",
                  activity: "Sample authentic regional cuisine",
                  category: "dining",
                },
                {
                  time: "04:00 PM",
                  activity: "Scenic walking tour and photography",
                  category: "culture",
                },
              ],
            },
          ],
        },
      });
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `Create a structured ${days}-day ${budget} travel itinerary for ${destination}. Format as JSON with days, titles, and activities.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({
      success: true,
      rawOutput: text,
    });
  } catch (error: unknown) {
    console.error("Trip generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate trip plan",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
