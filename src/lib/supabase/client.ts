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

export function isSupabaseLive(): boolean {
  return !isMockSupabase();
}

/**
 * Detects if a Supabase PostgREST error is caused by missing database tables
 * or an unmigrated database schema (e.g. table not found in schema cache).
 */
export function isTableMissingError(error: unknown): boolean {
  if (!error) return false;
  const errObj = error as { code?: string; message?: string; details?: string; hint?: string };
  const code = (errObj.code || "").toUpperCase();
  const msg = (errObj.message || "").toLowerCase();
  const details = (errObj.details || "").toLowerCase();

  return (
    code === "PGRST205" || // PostgREST table not found in schema cache
    code === "42P01" ||    // Postgres undefined_table (relation does not exist)
    code === "PGRST204" || // column not found in schema cache
    code === "PGRST116" || // no rows returned
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    (msg.includes("table") && msg.includes("not found")) ||
    details.includes("schema cache") ||
    details.includes("does not exist")
  );
}

export function createClient() {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  const supabaseUrl = rawUrl.length > 0 ? rawUrl : FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = rawKey.length > 0 ? rawKey : FALLBACK_SUPABASE_ANON_KEY;

  try {
    return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  } catch {
    return createBrowserClient<Database>(FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_ANON_KEY);
  }
}
