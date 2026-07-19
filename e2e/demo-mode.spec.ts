import { test, expect } from "@playwright/test";

/**
 * Smoke test — the app loads and is fully usable in DEMO MODE with zero
 * environment variables (no OpenAI / Supabase keys). No error overlays, correct
 * metadata, and no uncaught runtime errors.
 */
test.describe("demo mode smoke", () => {
  test("home page loads with no API keys and no runtime errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.goto("/");

    // Title carries the brand.
    await expect(page).toHaveTitle(/Chalkbox/i);

    // The hero headline renders.
    await expect(
      page.getByRole("heading", { name: /a sentence becomes a self-tested manipulative/i }),
    ).toBeVisible();

    // The honest demo-mode banner is shown (proves no live call is expected).
    // Target the DEMO_NOTICE copy specifically — "demo mode" also appears in
    // the FAQ and footer of the landing page.
    await expect(page.getByText(/pre-seeded build trace/i)).toBeVisible();

    // No Next.js error overlay.
    await expect(page.locator("nextjs-portal")).toHaveCount(0);

    // No uncaught runtime errors.
    expect(pageErrors, pageErrors.join("\n")).toEqual([]);
  });

  test("metadata description is present and on-message", async ({ page }) => {
    await page.goto("/");
    const description = await page.locator('head meta[name="description"]').getAttribute("content");
    expect(description).toBeTruthy();
    expect(description).toMatch(/self-test/i);
  });

  test("gallery page loads seeded content without keys", async ({ page }) => {
    await page.goto("/gallery");
    await expect(page.getByRole("heading", { name: /the gallery/i })).toBeVisible();
  });
});
