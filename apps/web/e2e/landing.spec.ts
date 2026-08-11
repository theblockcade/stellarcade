import { test, expect } from "@playwright/test";

test.describe("Landing & Navigation", () => {
  test("renders landing page and navigates through primary dashboard routes", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Stellarcade/i);

    // Verify main navigation links
    const sidebar = page.locator("nav");
    await expect(sidebar).toBeVisible();

    // Navigate to /about
    await page.click('a[href="/about"]');
    await expect(page).toHaveURL(/.*\/about/);
    await expect(page.locator("h1")).toContainText(/About Stellarcade/i);

    // Navigate to /verify
    await page.click('a[href="/verify"]');
    await expect(page).toHaveURL(/.*\/verify/);
    await expect(page.locator("h1")).toContainText(/Cryptographic Fairness Verifier/i);

    // Navigate to /cleanup
    await page.click('a[href="/cleanup"]');
    await expect(page).toHaveURL(/.*\/cleanup/);
    await expect(page.locator("h1")).toContainText(/Account Hygiene & Reserve Recovery/i);
  });
});
