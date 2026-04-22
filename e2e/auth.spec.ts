import { test, expect } from "@playwright/test";

/**
 * Auth E2E tests — require a running dev server at localhost:3000
 * and a seeded database (pnpm prisma:seed).
 *
 * Run with: pnpm e2e
 * (start dev server first with: pnpm dev)
 */

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows login form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.fill("input[type='email']", "wrong@email.com");
    await page.fill("input[type='password']", "wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Toast error should appear
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 5000 });
  });

  test("has forgot password link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });
});

test.describe("Forgot password page", () => {
  test("shows form and submits successfully", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /forgot password/i })).toBeVisible();

    await page.fill("input[type='email']", "any@email.com");
    await page.getByRole("button", { name: /send reset link/i }).click();

    // Shows confirmation (always succeeds to prevent email enumeration)
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Root redirect", () => {
  test("redirects / to /login when unauthenticated", async ({ page }) => {
    await page.goto("/");
    // Should land on /login (middleware redirects unauthenticated users)
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("redirects /dashboard to /login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
