import { test, expect } from "@playwright/test";

/**
 * Core user journey — the Create flow. A teacher types a misconception, Codex
 * (stubbed in demo mode) runs its self-test build trace, and a phone-friendly
 * share link is published. Also covers the safety-gate reject path.
 */
test.describe("create flow", () => {
  test("misconception → self-test trace → published share link", async ({ page }) => {
    await page.goto("/");

    const prompt = page.getByPlaceholder(
      /Show why dividing by a fraction makes the answer bigger/i,
    );
    await prompt.fill("Show why dividing by a fraction makes the answer bigger, not smaller.");

    await page.getByRole("button", { name: /create manipulative/i }).click();

    // The self-test build timeline appears (the moat, made visible).
    await expect(page.getByTestId("build-timeline")).toBeVisible();

    // The flow settles on a published result with a share link.
    await expect(page.getByTestId("result-state")).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(/Student share link/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible();
  });

  test("example chip fills the prompt and enables generation", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /why dividing by a fraction/i }).click();

    const createBtn = page.getByRole("button", { name: /create manipulative/i });
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    await expect(page.getByTestId("build-timeline")).toBeVisible();
  });

  test("off-curriculum prompt is rejected by the safety gate", async ({ page }) => {
    await page.goto("/");

    await page
      .getByPlaceholder(/Show why dividing by a fraction/i)
      .fill("Write a poem about my favorite color.");

    await page.getByRole("button", { name: /create manipulative/i }).click();

    // Reject path surfaces a failure card and never publishes.
    await expect(page.getByTestId("failure-card")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("result-state")).toHaveCount(0);
  });
});
