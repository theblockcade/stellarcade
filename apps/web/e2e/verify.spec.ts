import { test, expect } from "@playwright/test";

test.describe("Fairness Verifier (/verify)", () => {
  test("loads fairness verifier and runs sample vector verification", async ({ page }) => {
    await page.goto("/verify");

    await expect(page.locator("h1").first()).toContainText("Provable Fairness Verifier");

    // Click sample vector 1
    const vectorBtn = page.getByTestId("preset-coin-flip-pass").or(page.getByRole("button", { name: /Coin Flip/i }));
    await expect(vectorBtn.first()).toBeVisible();
    await vectorBtn.first().click();

    // Verify verification button
    const verifyBtn = page.getByTestId("verify-execute-btn");
    await verifyBtn.click();

    // Check verified status
    await expect(page.getByText(/Commitment Verified/i)).toBeVisible();
  });
});
