import test from "node:test";
import assert from "node:assert";
import { NextRequest } from "next/server";
import { globalRateLimiter, enforceRateLimit } from "@/lib/security/rate-limiter";
import { middleware } from "@/middleware";
import { GET as getTrips, POST as postTrips } from "@/app/api/trips/route";
import { GET as getProfile } from "@/app/api/profile/route";
import { GET as getMemories } from "@/app/api/memories/route";
import { GET as getRecommendations } from "@/app/api/recommendations/route";
import { POST as postRagChat } from "@/app/api/rag/chat/route";
import { POST as postRagSearch } from "@/app/api/rag/search/route";
import { GET as getAdminKnowledge, POST as postAdminKnowledge } from "@/app/api/admin/knowledge/route";
import { POST as postAdminSeed } from "@/app/api/admin/knowledge/seed/route";
import { POST as postCopilotChat } from "@/app/api/copilot/chat/route";
import { POST as postPublicProfile } from "@/app/api/public-profiles/route";
import { GET as getTripDetail } from "@/app/api/trips/[id]/route";
import { GET as getTripDocuments } from "@/app/api/trips/[id]/documents/route";
import { createTrip } from "@/lib/services/trip-service";

// ==============================================================================
// 1. Edge Middleware API Route Authentication & Rate Limiting Gate
// ==============================================================================

test("Middleware: Blocks unauthenticated requests to protected API endpoints with 401", async () => {
  const protectedPaths = [
    "/api/trips",
    "/api/profile",
    "/api/memories",
    "/api/recommendations",
    "/api/copilot/chat",
    "/api/rag/chat",
    "/api/rag/search",
    "/api/admin/knowledge",
  ];

  for (const path of protectedPaths) {
    const unauthReq = new NextRequest(`http://localhost:3000${path}`, {
      headers: { "x-real-ip": "10.0.0.1" },
    });

    const res = await middleware(unauthReq);
    assert.strictEqual(
      res.status,
      401,
      `Expected 401 Unauthorized for unauthenticated request to ${path}`
    );
    const body = await res.json();
    assert.ok(body.error?.includes("Unauthorized"));
  }
});

test("Middleware: Allows public API endpoints without authentication", async () => {
  const publicPaths = [
    { url: "http://localhost:3000/api/health", method: "GET" },
    { url: "http://localhost:3000/api/public-profiles", method: "GET" },
    { url: "http://localhost:3000/api/public-profiles/priya_travels", method: "GET" },
    { url: "http://localhost:3000/api/tourism/states", method: "GET" },
    { url: "http://localhost:3000/api/destinations", method: "GET" },
  ];

  for (const p of publicPaths) {
    const req = new NextRequest(p.url, {
      method: p.method,
      headers: { "x-real-ip": "10.0.0.2" },
    });

    const res = await middleware(req);
    // Public routes are not blocked by 401 auth gate
    assert.notStrictEqual(
      res.status,
      401,
      `Public endpoint ${p.url} should NOT return 401`
    );
  }
});

test("Middleware: Enforces sliding-window rate limit on API endpoints", async () => {
  const ip = "10.10.10.99";
  const rateLimitReq = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "x-real-ip": ip },
  });

  const ipKey = `api_auth:${ip}:`;
  globalRateLimiter.reset(ipKey);

  // Send requests up to limit (15 req/min for auth)
  for (let i = 0; i < 15; i++) {
    const res = await middleware(rateLimitReq);
    assert.notStrictEqual(res.status, 429, `Request ${i + 1} should be within limit`);
  }

  // 16th request must exceed rate limit and return 429
  const blockedRes = await middleware(rateLimitReq);
  assert.strictEqual(blockedRes.status, 429, "Exceeded request must receive 429");
  assert.ok(blockedRes.headers.get("Retry-After"), "Must include Retry-After header");
});

// ==============================================================================
// 2. Defense-in-Depth Route Handler Authorization Gates (401 Unauthorized)
// ==============================================================================

test("Route Handlers: Reject unauthenticated callers with 401", async () => {
  const emptyHeaders = { "x-real-ip": "127.0.0.1", "x-test-bypass-ratelimit": "true" };

  // 1. Trips List (GET)
  const reqTripsGet = new NextRequest("http://localhost:3000/api/trips", { headers: emptyHeaders });
  const resTripsGet = await getTrips(reqTripsGet);
  assert.strictEqual(resTripsGet.status, 401);

  // 2. Trips Create (POST)
  const reqTripsPost = new NextRequest("http://localhost:3000/api/trips", {
    method: "POST",
    headers: emptyHeaders,
    body: JSON.stringify({ origin: "Delhi", destination: "Goa" }),
  });
  const resTripsPost = await postTrips(reqTripsPost);
  assert.strictEqual(resTripsPost.status, 401);

  // 3. User Profile (GET)
  const reqProfile = new NextRequest("http://localhost:3000/api/profile", { headers: emptyHeaders });
  const resProfile = await getProfile(reqProfile);
  assert.strictEqual(resProfile.status, 401);

  // 4. User Memories (GET)
  const reqMemories = new NextRequest("http://localhost:3000/api/memories", { headers: emptyHeaders });
  const resMemories = await getMemories(reqMemories);
  assert.strictEqual(resMemories.status, 401);

  // 5. Recommendations (GET)
  const reqRecs = new NextRequest("http://localhost:3000/api/recommendations", { headers: emptyHeaders });
  const resRecs = await getRecommendations(reqRecs);
  assert.strictEqual(resRecs.status, 401);

  // 6. RAG Chat (POST)
  const reqRagChat = new NextRequest("http://localhost:3000/api/rag/chat", {
    method: "POST",
    headers: emptyHeaders,
    body: JSON.stringify({ question: "Is monsoon safe in Kerala?" }),
  });
  const resRagChat = await postRagChat(reqRagChat);
  assert.strictEqual(resRagChat.status, 401);

  // 7. RAG Search (POST)
  const reqRagSearch = new NextRequest("http://localhost:3000/api/rag/search", {
    method: "POST",
    headers: emptyHeaders,
    body: JSON.stringify({ query: "heritage temple entry rules" }),
  });
  const resRagSearch = await postRagSearch(reqRagSearch);
  assert.strictEqual(resRagSearch.status, 401);

  // 8. Copilot Chat (POST)
  const reqCopilot = new NextRequest("http://localhost:3000/api/copilot/chat", {
    method: "POST",
    headers: emptyHeaders,
    body: JSON.stringify({ message: "Find hotels in Jaipur" }),
  });
  const resCopilot = await postCopilotChat(reqCopilot);
  assert.strictEqual(resCopilot.status, 401);

  // 9. Public Profile Upsert (POST)
  const reqPublicProfile = new NextRequest("http://localhost:3000/api/public-profiles", {
    method: "POST",
    headers: emptyHeaders,
    body: JSON.stringify({ username: "test_nomad", display_name: "Test Nomad" }),
  });
  const resPublicProfile = await postPublicProfile(reqPublicProfile);
  assert.strictEqual(resPublicProfile.status, 401);
});

// ==============================================================================
// 3. Role-Based Authorization Gates (403 Forbidden for Non-Admins)
// ==============================================================================

test("RBAC: Regular traveler cannot access admin endpoints (403 Forbidden)", async () => {
  // Demo traveler header (role: traveler)
  const travelerHeaders = {
    "x-test-user-id": "demo-user-123",
    "x-test-bypass-ratelimit": "true",
  };

  // 1. GET /api/admin/knowledge
  const reqGetAdmin = new NextRequest("http://localhost:3000/api/admin/knowledge", {
    headers: travelerHeaders,
  });
  const resGetAdmin = await getAdminKnowledge(reqGetAdmin);
  assert.strictEqual(resGetAdmin.status, 403, "Traveler must be forbidden from admin knowledge list");
  const bodyGet = await resGetAdmin.json();
  assert.ok(bodyGet.error?.includes("Administrator"));

  // 2. POST /api/admin/knowledge
  const reqPostAdmin = new NextRequest("http://localhost:3000/api/admin/knowledge", {
    method: "POST",
    headers: travelerHeaders,
    body: JSON.stringify({ title: "Unauthorized Doc", content: "Content", source: "Hacker" }),
  });
  const resPostAdmin = await postAdminKnowledge(reqPostAdmin);
  assert.strictEqual(resPostAdmin.status, 403, "Traveler must be forbidden from creating admin documents");

  // 3. POST /api/admin/knowledge/seed
  const reqSeed = new NextRequest("http://localhost:3000/api/admin/knowledge/seed", {
    method: "POST",
    headers: travelerHeaders,
  });
  const resSeed = await postAdminSeed(reqSeed);
  assert.strictEqual(resSeed.status, 403, "Traveler must be forbidden from running admin knowledge seed");
});

test("RBAC: Authenticated administrator can access admin endpoints (200 OK)", async () => {
  // Admin header (role: admin)
  const adminHeaders = {
    "x-test-user-id": "admin-user-001",
    "x-test-bypass-ratelimit": "true",
  };

  const reqGetAdmin = new NextRequest("http://localhost:3000/api/admin/knowledge", {
    headers: adminHeaders,
  });
  const resGetAdmin = await getAdminKnowledge(reqGetAdmin);
  assert.strictEqual(resGetAdmin.status, 200, "Administrator must have access to admin knowledge list");
  const body = await resGetAdmin.json();
  assert.strictEqual(body.success, true);
});

// ==============================================================================
// 4. Resource Ownership Isolation (Cross-User Access Prevention)
// ==============================================================================

test("Ownership Isolation: User B cannot access User A's private trip details or documents", async () => {
  const aliceId = "user-alice-vault";
  const bobId = "user-bob-intruder";

  // Alice creates a private trip
  const aliceTrip = await createTrip(
    {
      origin: "Bengaluru",
      destination: "Coorg",
      start_date: "2026-11-10",
      end_date: "2026-11-14",
      budget: 30000,
      traveller_count: 2,
    },
    aliceId
  );
  assert.ok(aliceTrip.success && aliceTrip.data?.id);
  const tripId = aliceTrip.data.id;

  // Bob attempts to read Alice's trip via GET /api/trips/[id]
  const bobReq = new NextRequest(`http://localhost:3000/api/trips/${tripId}`, {
    headers: {
      "x-test-user-id": bobId,
      "x-test-bypass-ratelimit": "true",
    },
  });
  const bobTripRes = await getTripDetail(bobReq, { params: { id: tripId } });
  assert.strictEqual(bobTripRes.status, 404, "User B should receive 404 for unauthorized trip");

  // Bob attempts to read Alice's documents via GET /api/trips/[id]/documents
  const bobDocReq = new NextRequest(`http://localhost:3000/api/trips/${tripId}/documents`, {
    headers: {
      "x-test-user-id": bobId,
      "x-test-bypass-ratelimit": "true",
    },
  });
  const bobDocRes = await getTripDocuments(bobDocReq, { params: { id: tripId } });
  assert.strictEqual(bobDocRes.status, 403, "User B should receive 403 Forbidden for unauthorized documents");
});

// ==============================================================================
// 5. Legitimate Authenticated Access
// ==============================================================================

test("Authentication: Authenticated traveler can access their own endpoints", async () => {
  const authHeaders = {
    "x-test-user-id": "demo-user-123",
    "x-test-bypass-ratelimit": "true",
  };

  // 1. GET /api/trips succeeds
  const reqTrips = new NextRequest("http://localhost:3000/api/trips", { headers: authHeaders });
  const resTrips = await getTrips(reqTrips);
  assert.strictEqual(resTrips.status, 200);

  // 2. GET /api/profile succeeds
  const reqProfile = new NextRequest("http://localhost:3000/api/profile", { headers: authHeaders });
  const resProfile = await getProfile(reqProfile);
  assert.strictEqual(resProfile.status, 200);

  // 3. GET /api/recommendations succeeds
  const reqRecs = new NextRequest("http://localhost:3000/api/recommendations", { headers: authHeaders });
  const resRecs = await getRecommendations(reqRecs);
  assert.strictEqual(resRecs.status, 200);

  // 4. GET /api/memories succeeds
  const reqMemories = new NextRequest("http://localhost:3000/api/memories", { headers: authHeaders });
  const resMemories = await getMemories(reqMemories);
  assert.strictEqual(resMemories.status, 200);
});
