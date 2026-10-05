import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { appDb } from "@/lib/db/app-db";

test("Database: Local persistent file database initialization and seed data", () => {
  const stats = appDb.getStats();
  assert.ok(stats.usersCount >= 2, "Database must have at least 2 seeded users");
  assert.ok(stats.sessionsCount >= 1, "Database must have seeded active sessions");
  assert.ok(stats.profilesCount >= 2, "Database must have seeded user profiles");

  const dbFilePath = path.resolve(process.cwd(), "data", "app-db.json");
  assert.ok(fs.existsSync(dbFilePath), "data/app-db.json must exist on disk");

  const raw = fs.readFileSync(dbFilePath, "utf-8");
  const data = JSON.parse(raw);
  assert.ok(Array.isArray(data.users), "data.users must be an array");

  // Ensure passwords are salted and hashed (never plaintext)
  for (const user of data.users) {
    assert.notStrictEqual(user.password_hash, "password123", "Passwords must be securely hashed");
    assert.notStrictEqual(user.password_hash, "admin123", "Passwords must be securely hashed");
    assert.ok(user.salt && user.salt.length >= 16, "Users must have a cryptographic salt");
  }
});

test("Database: User Registration, Duplicate Prevention & Password Hashing", () => {
  const testEmail = `traveler-${Date.now()}@test.com`;

  // 1. Rejects short password
  const shortPassResult = appDb.registerUser({
    email: testEmail,
    password: "123",
    fullName: "Short Pass",
  });
  assert.strictEqual(shortPassResult.success, false);
  assert.ok(shortPassResult.error?.includes("at least 6 characters"));

  // 2. Successful registration
  const regResult = appDb.registerUser({
    email: testEmail,
    password: "securePassword2026",
    fullName: "Aryan Sharma",
  });
  assert.strictEqual(regResult.success, true);
  assert.ok(regResult.user?.id, "User must receive an ID");
  assert.strictEqual(regResult.user?.email, testEmail);

  // 3. Rejects duplicate email registration
  const dupResult = appDb.registerUser({
    email: testEmail,
    password: "anotherPassword",
    fullName: "Duplicate User",
  });
  assert.strictEqual(dupResult.success, false);
  assert.ok(dupResult.error?.includes("already exists"));

  // 4. Profile created automatically
  const profile = appDb.getProfile(regResult.user!.id);
  assert.ok(profile, "Profile must be created for registered user");
  assert.strictEqual(profile?.full_name, "Aryan Sharma");
});

test("Database: Credential Verification & Session Management", () => {
  const testEmail = `login-${Date.now()}@test.com`;
  const testPassword = "validPassword123";

  appDb.registerUser({
    email: testEmail,
    password: testPassword,
    fullName: "Vikram Malhotra",
  });

  // 1. Rejects incorrect password
  const failResult = appDb.verifyCredentials(testEmail, "wrongPassword");
  assert.strictEqual(failResult.success, false);
  assert.ok(failResult.error?.includes("Incorrect password"));

  // 2. Rejects non-existent email
  const notFoundResult = appDb.verifyCredentials("nonexistent@random.com", testPassword);
  assert.strictEqual(notFoundResult.success, false);
  assert.ok(notFoundResult.error?.includes("No account found"));

  // 3. Verifies correct credentials
  const successResult = appDb.verifyCredentials(testEmail, testPassword);
  assert.strictEqual(successResult.success, true);
  assert.strictEqual(successResult.user?.email, testEmail);

  // 4. Creates and verifies session
  const session = appDb.createSession(successResult.user!.id);
  assert.ok(session.token, "Session must have a token");

  const fetchedSession = appDb.getSession(session.token);
  assert.ok(fetchedSession, "Session must be retrievable");
  assert.strictEqual(fetchedSession?.user_id, successResult.user!.id);

  // 5. Deletes session on logout
  appDb.deleteSession(session.token);
  assert.strictEqual(appDb.getSession(session.token), null, "Deleted session must return null");
});

test("API: /api/auth/register and /api/auth/login integration", async () => {
  const email = `api-test-${Date.now()}@test.com`;
  const password = "mySecretPassword123";

  // 1. Register through API
  const regRes = await fetch("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName: "API Tester" }),
  });
  assert.strictEqual(regRes.status, 200, "Register API must return 200");
  const regData = await regRes.json();
  assert.strictEqual(regData.success, true);
  assert.strictEqual(regData.user.email, email);

  // 2. Login through API with wrong password
  const failLogin = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "wrong" }),
  });
  assert.strictEqual(failLogin.status, 401, "Wrong password must return 401");

  // 3. Login through API with correct password
  const successLogin = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.strictEqual(successLogin.status, 200, "Correct credentials must return 200");
  const loginData = await successLogin.json();
  assert.strictEqual(loginData.success, true);
  assert.strictEqual(loginData.user.email, email);

  // 4. Login with seeded demo traveler
  const demoLogin = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@tripwise.ai", password: "password123" }),
  });
  assert.strictEqual(demoLogin.status, 200, "Demo login must return 200");
});

test("UI & Responsiveness: Landing page and auth routes provide responsive options", async () => {
  // 1. Root Landing Page contains Login and Register links
  const landingRes = await fetch("http://localhost:3000/");
  assert.strictEqual(landingRes.status, 200);
  const landingHtml = await landingRes.text();
  assert.ok(landingHtml.includes("Login"), "Landing page must contain Login");
  assert.ok(landingHtml.includes("Get Started") || landingHtml.includes("Register"), "Landing page must contain Get Started / Register");

  // 2. /login page is accessible and provides sign-in form
  const loginRes = await fetch("http://localhost:3000/login");
  assert.strictEqual(loginRes.status, 200, "Login page must return 200 OK");
  const loginHtml = await loginRes.text();
  assert.ok(loginHtml.includes("Sign In") || loginHtml.includes("Login"), "Login page must have Sign In option");
  assert.ok(loginHtml.includes("Register"), "Login page must have link to Register");

  // 3. /register page is accessible and provides sign-up form
  const registerRes = await fetch("http://localhost:3000/register");
  assert.strictEqual(registerRes.status, 200, "Register page must return 200 OK");
  const registerHtml = await registerRes.text();
  assert.ok(registerHtml.includes("Create an Account") || registerHtml.includes("Register"), "Register page must have Create an Account option");
  assert.ok(registerHtml.includes("Sign In"), "Register page must have link to Sign In");
});
