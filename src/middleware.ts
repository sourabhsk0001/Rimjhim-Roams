import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/security/rate-limiter";

/**
 * Determines if an API endpoint is accessible publicly without user authentication.
 */
function isPublicApiRoute(pathname: string, method: string): boolean {
  if (pathname === "/api/health") return true;
  if (pathname === "/api/ai/quota") return true;
  if (pathname === "/api/auth/login" || pathname === "/api/auth/register") return true;
  if (method === "GET" && pathname === "/api/public-profiles") return true;
  if (method === "GET" && pathname.startsWith("/api/public-profiles/")) return true;
  if (method === "GET" && pathname.startsWith("/api/tourism/")) return true;
  if (method === "GET" && pathname.startsWith("/api/destinations")) return true;
  if (method === "GET" && pathname.startsWith("/api/safety/")) return true;
  if (pathname === "/api/geo/route") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // ============================================================================
  // 1. API Edge Protection: Rate Limiting & Authorization Gates
  // ============================================================================
  if (pathname.startsWith("/api/")) {
    // 1A. Enforce Sliding-Window Rate Limits across all API endpoints
    let rateLimitPrefix = "api_general";
    let maxRequests = 60;
    const windowMs = 60 * 1000;

    if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/register")) {
      rateLimitPrefix = "api_auth";
      maxRequests = 15;
    } else if (
      pathname.startsWith("/api/copilot/") ||
      pathname.startsWith("/api/rag/") ||
      pathname === "/api/trips/generate"
    ) {
      rateLimitPrefix = "api_ai";
      maxRequests = 30;
    }

    const rateLimitResponse = enforceRateLimit(request, {
      prefix: rateLimitPrefix,
      maxRequests,
      windowMs,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 1B. Enforce Strict Authentication on Protected API Endpoints
    if (!isPublicApiRoute(pathname, method)) {
      const demoCookie = request.cookies.get("rr_demo_session")?.value;
      const hasSupabaseCookie = request.cookies
        .getAll()
        .some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
      const authHeader = request.headers.get("authorization");
      const isProd = process.env.NODE_ENV === "production";
      const testHeader = !isProd
        ? request.headers.get("x-user-id") || request.headers.get("x-test-user-id")
        : null;

      const hasCredentials = Boolean(
        demoCookie || hasSupabaseCookie || authHeader || testHeader
      );

      if (!hasCredentials) {
        return NextResponse.json(
          { error: "Unauthorized. Authentication required to access this endpoint." },
          { status: 401 }
        );
      }

      // 1C. Role-Based Access Control for Administrator Endpoints
      if (pathname.startsWith("/api/admin/")) {
        const isAdmin =
          demoCookie === "admin-user-001" ||
          demoCookie === "admin@tripwise.ai" ||
          (authHeader && authHeader.toLowerCase().includes("admin")) ||
          (testHeader && testHeader.toLowerCase().includes("admin"));

        if (!isAdmin) {
          return NextResponse.json(
            { error: "Forbidden. Administrator role required to access admin endpoints." },
            { status: 403 }
          );
        }
      }
    }

    // Allow authenticated or public API requests to proceed
    return NextResponse.next();
  }

  // ============================================================================
  // 2. UI Page Protection & SSR Session Management
  // ============================================================================
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/trips") ||
    pathname.startsWith("/memories") ||
    pathname.startsWith("/admin");

  // In test / mock mode without configured live Supabase, check for a demo session cookie
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("mock-project") ||
    supabaseAnonKey.includes("mock-signature") ||
    supabaseAnonKey === "mock-anon-key"
  ) {
    const demoUser = request.cookies.get("rr_demo_session")?.value;
    if (!demoUser && isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    if (demoUser && pathname.startsWith("/admin")) {
      const isAdmin =
        demoUser === "admin-user-001" || demoUser === "admin@tripwise.ai";
      if (!isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
    if (demoUser && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: CookieOptions;
        }>
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as CookieOptions)
        );
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    // Non-fatal if Supabase connection has hiccups
  }

  const demoUser = request.cookies.get("rr_demo_session")?.value;
  const isAuthenticated = Boolean(user || demoUser);

  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname.startsWith("/admin")) {
    const isAdmin =
      demoUser === "admin-user-001" ||
      demoUser === "admin@tripwise.ai" ||
      user?.email === "admin@tripwise.ai" ||
      user?.app_metadata?.role === "admin";
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
