import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "Rimjhim Roams",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    services: {
      supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    },
  });
}
