import { test, expect } from "@playwright/test";

test.describe("About Page (/about)", () => {
  test("loads about page and displays four repository architecture breakdown", async ({ page }) => {
    await page.goto("/about");

    await expect(page.locator("h1")).toContainText("About Stellarcade");
    await expect(page.getByText("stellarcade-sdk")).toBeVisible();
    await expect(page.getByText("stellarcade-arbiter")).toBeVisible();
    await expect(page.getByText("stellarcade-bot")).toBeVisible();
  });
});
