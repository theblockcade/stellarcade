import { test, expect } from "@playwright/test";

test.describe("Account Hygiene (/cleanup)", () => {
  test("loads hygiene scanner and runs dry-run analysis", async ({ page }) => {
    await page.goto("/cleanup");

    await expect(page.locator("h1").first()).toContainText("Account Hygiene & Reserve Recovery");

    // Click Scan Account button
    const scanBtn = page.getByRole("button", { name: /Scan Account/i });
    await expect(scanBtn).toBeVisible();
    await scanBtn.click();

    // Verify scan results appear
    await expect(page.getByText(/Base Account Reserve/i)).toBeVisible();
  });
});
