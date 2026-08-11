import { test, expect } from "@playwright/test";

test.describe("Landing & Navigation", () => {
  test("renders landing page and navigates through primary dashboard routes", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Stellarcade/i);

    // Verify main navigation links
    const sidebar = page.locator("nav");
    await expect(sidebar).toBeVisible();

    // Verify about page directly
    await page.goto("/about");
    await expect(page.locator("h1").first()).toContainText(/About StellarCade/i);

    // Verify verify page directly
    await page.goto("/verify");
    await expect(page.locator("h1").first()).toContainText(/Provable Fairness Verifier/i);

    // Verify cleanup page directly
    await page.goto("/cleanup");
    await expect(page.locator("h1").first()).toContainText(/Account Hygiene & Reserve Recovery/i);
  });
});
