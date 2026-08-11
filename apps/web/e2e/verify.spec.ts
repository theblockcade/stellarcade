import { test, expect } from "@playwright/test";

test.describe("Fairness Verifier (/verify)", () => {
  test("loads fairness verifier and runs sample vector verification", async ({ page }) => {
    await page.goto("/verify");

    await expect(page.locator("h1")).toContainText("Cryptographic Fairness Verifier");

    // Click sample vector 1
    const vectorBtn = page.getByRole("button", { name: /Vector 1/i });
    await expect(vectorBtn).toBeVisible();
    await vectorBtn.click();

    // Verify verification button
    const verifyBtn = page.getByTestId("verify-execute-btn");
    await verifyBtn.click();

    // Check verified status
    await expect(page.getByText(/Commitment Verified/i)).toBeVisible();
  });
});
