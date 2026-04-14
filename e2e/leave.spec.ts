import { test, expect } from "@playwright/test";

/**
 * Leave management E2E tests.
 * Requires: running dev server + seeded DB + valid session cookie.
 *
 * These tests validate the critical leave application flow.
 */

// Helper: log in as admin and store auth state
async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill("input[type='email']", "admin@firm.com");
  await page.fill("input[type='password']", "Admin@123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for redirect to dashboard or change-password
  await page.waitForURL(/\/(dashboard|change-password)/, { timeout: 10000 });
}

test.describe("Authenticated leave flows", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("dashboard loads after login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 5000 });
  });

  test("leave page is accessible", async ({ page }) => {
    await page.goto("/leave");
    await expect(page.getByRole("heading", { name: /my leave/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: /apply for leave/i })).toBeVisible();
  });

  test("leave application form opens", async ({ page }) => {
    await page.goto("/leave");
    await page.getByRole("button", { name: /apply for leave/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText(/leave type/i)).toBeVisible();
  });

  test("directory page is accessible", async ({ page }) => {
    await page.goto("/directory");
    await expect(page.getByRole("heading", { name: /employee directory/i })).toBeVisible({ timeout: 5000 });
  });

  test("admin panel is accessible for admin role", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: /admin panel/i })).toBeVisible({ timeout: 5000 });
  });

  test("logout works", async ({ page }) => {
    await page.goto("/dashboard");
    // Click avatar dropdown to find logout
    await page.locator("[data-radix-collection-item]").first().click().catch(() => {
      // Fallback: try the avatar button directly
    });
    // Navigate directly to logout via API
    await page.request.post("/api/auth/logout");
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
