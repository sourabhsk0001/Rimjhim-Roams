import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

export const FALLBACK_SUPABASE_URL = "https://mock-project.supabase.co";
// Valid structural dummy JWT for Supabase client initialization without live credentials
export const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM0NDk2MDB9.mock-signature-for-build";

export function isMockSupabase(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    !url ||
    !key ||
    url.includes("mock-project") ||
    key.includes("mock-signature-for-build") ||
    key === "mock-anon-key"
  );
}

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
