import { test, expect } from "@playwright/test";

test.describe("TripWise AI — Production-Grade Critical E2E User Journey", () => {
  const timestamp = Date.now();
  const testUser = {
    fullName: "Aarav Sharma",
    email: `aarav_${timestamp}@example.com`,
    password: "Password@123",
  };

  test("Critical Flow: Register -> Login -> Create Trip -> Discover -> Itinerary -> Budget -> AI Copilot -> Replan -> Expense Split", async ({
    page,
  }) => {
    // --------------------------------------------------------------------------
    // 1. REGISTER
    // --------------------------------------------------------------------------
    await page.goto("/register");
    await expect(page.locator("h2, h3, h1").filter({ hasText: /Create an Account/i }).first()).toBeVisible();

    await page.fill("#fullName", testUser.fullName);
    await page.fill("#email", testUser.email);
    await page.fill("#password", testUser.password);
    await page.fill("#confirmPassword", testUser.password);

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/Dashboard/i);

    // --------------------------------------------------------------------------
    // 2. SIGN OUT & LOGIN (Verify session clearance and re-authentication)
    // --------------------------------------------------------------------------
    const signOutBtn = page.locator('button:has-text("Sign Out")').first();
    await signOutBtn.click();
    await page.waitForURL(/\/login/, { timeout: 15000 });

    await page.fill("#email", testUser.email);
    await page.fill("#password", testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator("h1")).toContainText(/Dashboard/i);

    // --------------------------------------------------------------------------
    // 3. DESTINATION DISCOVERY (Explore Catalog)
    // --------------------------------------------------------------------------
    await page.goto("/explore");
    await expect(page.locator("h1")).toContainText(/Explore Destinations/i);

    const searchInput = page.locator('input[placeholder*="Search by city"]');
    await searchInput.fill("Goa");
    await searchInput.press("Enter");

    await expect(page.locator("text=Goa").first()).toBeVisible({ timeout: 10000 });

    // --------------------------------------------------------------------------
    // 4. CREATE TRIP
    // --------------------------------------------------------------------------
    await page.goto("/trips/new");
    await expect(page.locator("h3, h2, h1").filter({ hasText: /Plan a New Journey/i }).first()).toBeVisible();

    const today = new Date();
    const startStr = today.toISOString().split("T")[0];
    const end = new Date(today);
    end.setDate(end.getDate() + 3);
    const endStr = end.toISOString().split("T")[0];

    await page.fill("#origin", "Mumbai");
    await page.fill("#destination", "Goa");
    await page.fill("#startDate", startStr);
    await page.fill("#endDate", endStr);
    await page.fill("#budget", "35000");

    await page.click('button[type="submit"]');
    await page.waitForURL(
      (url) => url.pathname.startsWith("/trips/") && url.pathname !== "/trips/new",
      { timeout: 15000 }
    );

    const currentUrl = page.url();
    const tripId = currentUrl.split("/trips/")[1].split("?")[0].split("/")[0];
    expect(tripId).toBeTruthy();
    expect(tripId).not.toBe("new");

    // --------------------------------------------------------------------------
    // 5. VIEW TRIP WORKSPACE & GENERATE TRIP
    // --------------------------------------------------------------------------
    const generateBtn = page.locator('button:has-text("Generate Complete Trip")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(3500);
    }

    // Verify Workspace navigation is present
    await expect(page.locator('a[href$="/itinerary"]').first()).toBeVisible();
    await expect(page.locator('a[href$="/budget"]').first()).toBeVisible();

    // --------------------------------------------------------------------------
    // 6. VIEW ITINERARY
    // --------------------------------------------------------------------------
    await page.goto(`/trips/${tripId}/itinerary`);
    await expect(page.locator("text=Day 1").first()).toBeVisible({ timeout: 15000 });

    // Verify visual categories are rendered
    await expect(page.locator(".border-l-4, .rounded-xl, .border").first()).toBeVisible();

    // --------------------------------------------------------------------------
    // 7. VIEW BUDGET LEDGER & KPI CARDS
    // --------------------------------------------------------------------------
    await page.goto(`/trips/${tripId}/budget`);
    await expect(page.locator("text=Estimated").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Actual").first()).toBeVisible();
    await expect(page.locator("text=Remaining").first()).toBeVisible();

    // --------------------------------------------------------------------------
    // 8. OPEN AI TRAVEL COPILOT & ISSUE INSTRUCTION
    // --------------------------------------------------------------------------
    await page.goto(`/trips/${tripId}/assistant`);
    await expect(
      page.locator("h2, h3, h1").filter({ hasText: /AI Travel Copilot/i }).first()
    ).toBeVisible({ timeout: 15000 });

    const chatTextarea = page.locator('textarea[placeholder*="Ask Copilot"]').first();
    await chatTextarea.fill("Find a restaurant near my hotel under ₹500");

    const sendBtn = page.locator('button[type="submit"]').first();
    await sendBtn.click();

    // Verify assistant response or tool badge appears
    await expect(
      page.locator(".bg-blue-50, .bg-muted, .rounded-2xl").filter({ hasText: /restaurant|hotel|₹/i }).first()
    ).toBeVisible({ timeout: 25000 });

    // --------------------------------------------------------------------------
    // 9. RE-PLAN DAY
    // --------------------------------------------------------------------------
    await page.goto(`/trips/${tripId}`);
    const replanBtn = page.locator('button:has-text("Re-Plan"), button:has-text("Re-plan My Day")').first();
    if (await replanBtn.isVisible()) {
      await replanBtn.click();
      const applyBtn = page.locator('button:has-text("Apply"), button:has-text("Recalculate")').first();
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
      }
    }

    // --------------------------------------------------------------------------
    // 10. EXPENSE SPLITTING & SETTLEMENT
    // --------------------------------------------------------------------------
    await page.goto(`/trips/${tripId}/expenses`);
    await expect(page.locator("h1")).toContainText(/Expense/i);

    const addExpenseBtn = page.locator('button:has-text("Add Shared Expense"), button:has-text("Add Expense")').first();
    await addExpenseBtn.click();
    await page.waitForSelector('text=Add Shared Expense', { timeout: 5000 });

    // Fill expense details in modal
    await page.fill('input[placeholder*="Hotel Stay"]', "Seafood Shack Dinner");
    await page.fill('input[placeholder*="6000"]', "4500");

    const saveExpenseBtn = page.locator('button[type="submit"]:has-text("Save Expense")');
    await saveExpenseBtn.click();

    // Verify expense card appears in the ledger
    await expect(page.locator("text=Seafood Shack Dinner")).toBeVisible({ timeout: 15000 });
  });
});
