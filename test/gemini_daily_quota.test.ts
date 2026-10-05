import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  geminiQuotaManager,
  enforceGeminiQuota,
  getCurrentUtcDateString,
  getNextMidnightUtc,
} from "../src/lib/security/gemini-quota";
import { GET as getQuotaRoute } from "../src/app/api/ai/quota/route";
import { POST as copilotChatRoute } from "../src/app/api/copilot/chat/route";
import { POST as tripsGenerateRoute } from "../src/app/api/trips/generate/route";
import { POST as ragChatRoute } from "../src/app/api/rag/chat/route";

test("Gemini Daily Quota: Initial Quota State and Reset Calculation", () => {
  geminiQuotaManager.resetQuotaForTesting();
  geminiQuotaManager.restoreDefaultLimits();

  const status = geminiQuotaManager.getQuotaStatus("traveler-test-1");

  assert.equal(status.date, getCurrentUtcDateString());
  assert.equal(status.user?.userId, "traveler-test-1");
  assert.equal(status.user?.used, 0);
  assert.ok(status.user?.remaining > 0);
  assert.ok(status.server.remaining > 0);
  assert.ok(status.retryAfterSeconds > 0);
  assert.ok(status.resetAt.includes("T00:00:00.000Z"));

  // Verify Educational Reasoning in Explanations
  assert.ok(status.explanation.studentProjectNotice.toLowerCase().includes("student project"));
  assert.ok(status.explanation.studentProjectNotice.toLowerCase().includes("free tier"));
  assert.ok(status.explanation.fairUsePolicy.toLowerCase().includes("equitable access"));
  assert.ok(status.explanation.deterministicFallbackNotice.toLowerCase().includes("deterministic"));
});

test("Gemini Daily Quota: Consumes Quota Correctly", () => {
  geminiQuotaManager.resetQuotaForTesting();
  geminiQuotaManager.setLimitsForTesting({ userLimit: 5, serverLimit: 10 });

  const result1 = geminiQuotaManager.consumeQuota("traveler-consume-1");
  assert.equal(result1.allowed, true);
  assert.equal(result1.user.used, 1);
  assert.equal(result1.user.remaining, 4);
  assert.equal(result1.server.used, 1);
  assert.equal(result1.server.remaining, 9);

  const result2 = geminiQuotaManager.consumeQuota("traveler-consume-1");
  assert.equal(result2.allowed, true);
  assert.equal(result2.user.used, 2);
  assert.equal(result2.user.remaining, 3);
  assert.equal(result2.server.used, 2);
  assert.equal(result2.server.remaining, 8);
});

test("Gemini Daily Quota: Per-User Limit Enforcement with Student Project Reasoning", () => {
  geminiQuotaManager.resetQuotaForTesting();
  const testLimit = 3;
  geminiQuotaManager.setLimitsForTesting({ userLimit: testLimit, serverLimit: 100 });

  const userId = "student-evaluator-123";

  // Consume up to limit
  for (let i = 0; i < testLimit; i++) {
    const res = geminiQuotaManager.consumeQuota(userId);
    assert.equal(res.allowed, true, `Call ${i + 1} should be allowed`);
  }

  // Next call must be blocked
  const blockedResult = geminiQuotaManager.consumeQuota(userId);
  assert.equal(blockedResult.allowed, false);
  assert.equal(blockedResult.code, "USER_DAILY_QUOTA_EXCEEDED");
  assert.equal(blockedResult.reason, "student_project_free_tier");
  assert.equal(blockedResult.user.remaining, 0);

  // Assert Adequate Reasoning Explanation
  const msg = blockedResult.message || "";
  assert.ok(msg.toLowerCase().includes("student project"), "Must state it is a student project");
  assert.ok(msg.toLowerCase().includes("free"), "Must explain free-tier constraints");
  assert.ok(msg.toLowerCase().includes("gemini"), "Must reference Google Gemini API");
  assert.ok(msg.toLowerCase().includes("midnight utc"), "Must specify midnight UTC reset time");
  assert.ok(msg.toLowerCase().includes("deterministic"), "Must mention deterministic tools remain available");
});

test("Gemini Daily Quota: User Isolation (User A exhausted does not block User B)", () => {
  geminiQuotaManager.resetQuotaForTesting();
  geminiQuotaManager.setLimitsForTesting({ userLimit: 2, serverLimit: 10 });

  // Exhaust User A
  geminiQuotaManager.consumeQuota("user-A");
  geminiQuotaManager.consumeQuota("user-A");
  const userABlocked = geminiQuotaManager.consumeQuota("user-A");
  assert.equal(userABlocked.allowed, false);

  // User B should still be allowed
  const userBAllowed = geminiQuotaManager.consumeQuota("user-B");
  assert.equal(userBAllowed.allowed, true);
  assert.equal(userBAllowed.user.used, 1);
  assert.equal(userBAllowed.user.remaining, 1);
});

test("Gemini Daily Quota: Server-Wide Limit Enforcement across all users", () => {
  geminiQuotaManager.resetQuotaForTesting();
  const serverLimit = 4;
  geminiQuotaManager.setLimitsForTesting({ userLimit: 10, serverLimit });

  geminiQuotaManager.consumeQuota("user-1");
  geminiQuotaManager.consumeQuota("user-2");
  geminiQuotaManager.consumeQuota("user-3");
  geminiQuotaManager.consumeQuota("user-4");

  // Server quota reached
  const serverBlocked = geminiQuotaManager.consumeQuota("user-5");
  assert.equal(serverBlocked.allowed, false);
  assert.equal(serverBlocked.code, "SERVER_DAILY_QUOTA_EXCEEDED");
  assert.equal(serverBlocked.reason, "server_daily_quota_exceeded");
  assert.equal(serverBlocked.server.remaining, 0);

  // Assert Reasoning for Server-Wide Pause
  const msg = serverBlocked.message || "";
  assert.ok(msg.toLowerCase().includes("server-wide"), "Must mention server-wide limit");
  assert.ok(msg.toLowerCase().includes("student project"), "Must explain student project context");
  assert.ok(msg.toLowerCase().includes("free"), "Must explain free quota ceiling");
  assert.ok(msg.toLowerCase().includes("midnight utc"), "Must specify reset at midnight UTC");
});

test("Gemini Daily Quota: Date Rollover Resets Counters", () => {
  geminiQuotaManager.resetQuotaForTesting("2026-10-05");
  geminiQuotaManager.setLimitsForTesting({ userLimit: 2, serverLimit: 5 });

  geminiQuotaManager.consumeQuota("rollover-user");
  geminiQuotaManager.consumeQuota("rollover-user");
  assert.equal(geminiQuotaManager.consumeQuota("rollover-user").allowed, false);

  // Simulate new day rollover
  geminiQuotaManager.resetQuotaForTesting("2026-10-06");

  const newDayResult = geminiQuotaManager.consumeQuota("rollover-user");
  assert.equal(newDayResult.allowed, true);
  assert.equal(newDayResult.user.used, 1);
  assert.equal(newDayResult.user.remaining, 1);
});

test("Gemini Daily Quota: enforceGeminiQuota Middleware Helper (Status 429 & Headers)", () => {
  geminiQuotaManager.resetQuotaForTesting();
  geminiQuotaManager.setLimitsForTesting({ userLimit: 1, serverLimit: 10 });

  const userId = "test-middleware-user";

  const req1 = new NextRequest("http://localhost:3000/api/trips/generate", {
    method: "POST",
    headers: { "x-test-user-id": userId },
  });

  // Call 1: Allowed
  const res1 = enforceGeminiQuota(req1, userId);
  assert.equal(res1, null);

  // Call 2: Blocked with HTTP 429
  const req2 = new NextRequest("http://localhost:3000/api/trips/generate", {
    method: "POST",
    headers: { "x-test-user-id": userId },
  });
  const res2 = enforceGeminiQuota(req2, userId);
  assert.ok(res2, "Should return a NextResponse when limit exceeded");
  assert.equal(res2.status, 429);
  assert.ok(res2.headers.has("Retry-After"));
  assert.equal(res2.headers.get("X-Gemini-User-Limit"), "1");
  assert.equal(res2.headers.get("X-Gemini-User-Remaining"), "0");
  assert.ok(res2.headers.has("X-Gemini-Reset"));

  // Call 3: Test bypass header allows execution
  const reqBypass = new NextRequest("http://localhost:3000/api/trips/generate", {
    method: "POST",
    headers: {
      "x-test-user-id": userId,
      "x-bypass-gemini-quota": "true",
    },
  });
  const resBypass = enforceGeminiQuota(reqBypass, userId);
  assert.equal(resBypass, null, "Should allow when test bypass header is present");
});

test("Gemini Daily Quota API: GET /api/ai/quota Returns Status and Explanations", async () => {
  geminiQuotaManager.resetQuotaForTesting();
  geminiQuotaManager.restoreDefaultLimits();

  const req = new NextRequest("http://localhost:3000/api/ai/quota", {
    method: "GET",
    headers: { "x-test-user-id": "demo-user-123" },
  });

  const response = await getQuotaRoute(req);
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.success, true);
  assert.ok(json.quota);
  assert.equal(json.quota.user?.userId, "demo-user-123");
  assert.ok(json.quota.user?.remaining > 0);
  assert.ok(json.quota.explanation.studentProjectNotice.includes("student project"));
  assert.ok(json.quota.explanation.fairUsePolicy.includes("equitable access"));
});

test("Gemini Daily Quota API: POST /api/copilot/chat blocks with 429 when quota exceeded", async () => {
  geminiQuotaManager.resetQuotaForTesting();
  geminiQuotaManager.setLimitsForTesting({ userLimit: 1, serverLimit: 10 });

  const userId = "copilot-quota-user";

  // Consume user's 1 allowed call
  geminiQuotaManager.consumeQuota(userId);

  const req = new NextRequest("http://localhost:3000/api/copilot/chat", {
    method: "POST",
    headers: {
      "x-test-user-id": userId,
      "x-test-bypass-ratelimit": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({ message: "Where can I go in Kerala?" }),
  });

  const response = await copilotChatRoute(req);
  assert.equal(response.status, 429);

  const json = await response.json();
  assert.equal(json.success, false);
  assert.equal(json.code, "USER_DAILY_QUOTA_EXCEEDED");
  assert.equal(json.reason, "student_project_free_tier");
  assert.ok(json.message.toLowerCase().includes("student project"));
  assert.ok(json.message.toLowerCase().includes("free"));
});

test("Gemini Daily Quota API: POST /api/trips/generate blocks with 429 when quota exceeded", async () => {
  geminiQuotaManager.resetQuotaForTesting();
  geminiQuotaManager.setLimitsForTesting({ userLimit: 1, serverLimit: 10 });

  const userId = "trip-gen-quota-user";
  geminiQuotaManager.consumeQuota(userId);

  const req = new NextRequest("http://localhost:3000/api/trips/generate", {
    method: "POST",
    headers: {
      "x-test-user-id": userId,
      "x-test-bypass-ratelimit": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({ destination: "Varanasi", days: 2 }),
  });

  const response = await tripsGenerateRoute(req);
  assert.equal(response.status, 429);

  const json = await response.json();
  assert.equal(json.success, false);
  assert.equal(json.code, "USER_DAILY_QUOTA_EXCEEDED");
  assert.ok(json.message.toLowerCase().includes("student project"));
  assert.ok(json.message.toLowerCase().includes("free"));
});

test("Gemini Daily Quota API: POST /api/rag/chat blocks with 429 when quota exceeded", async () => {
  geminiQuotaManager.resetQuotaForTesting();
  geminiQuotaManager.setLimitsForTesting({ userLimit: 1, serverLimit: 10 });

  const userId = "rag-quota-user";
  geminiQuotaManager.consumeQuota(userId);

  const req = new NextRequest("http://localhost:3000/api/rag/chat", {
    method: "POST",
    headers: {
      "x-test-user-id": userId,
      "x-test-bypass-ratelimit": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({ question: "Do I need a permit for Ladakh?" }),
  });

  const response = await ragChatRoute(req);
  assert.equal(response.status, 429);

  const json = await response.json();
  assert.equal(json.success, false);
  assert.equal(json.code, "USER_DAILY_QUOTA_EXCEEDED");
  assert.ok(json.message.toLowerCase().includes("student project"));
  assert.ok(json.message.toLowerCase().includes("free"));
});
