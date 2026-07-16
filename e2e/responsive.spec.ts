import { test, expect } from "@playwright/test";

/**
 * Responsive layout — the same surface must hold up on a phone (a student's
 * device), a tablet, and a desktop with no horizontal overflow and usable
 * touch targets.
 */
const VIEWPORTS = [
  { label: "mobile", width: 375, height: 812 },
  { label: "tablet", width: 768, height: 1024 },
  { label: "desktop", width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.label} (${vp.width}px)`, () => {
    test("no horizontal overflow and header fits the viewport", async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      // The document must not scroll horizontally (allow 1px rounding slack).
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(vp.width + 1);

      // The header nav is present and within the viewport.
      const nav = page.getByRole("navigation");
      await expect(nav).toBeVisible();
      await expect(nav.getByRole("link", { name: /gallery/i })).toBeVisible();
      const box = await nav.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
      }
    });

    test("primary action has an accessible touch target", async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      const createBtn = page.getByRole("button", { name: /create manipulative/i });
      await expect(createBtn).toBeVisible();
      const box = await createBtn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(36);
      }
    });
  });
}
