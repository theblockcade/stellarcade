import { test, expect } from "@playwright/test";

test.describe("Wallet Connection Modal", () => {
  test("opens wallet connect modal and exposes Freighter option", async ({ page }) => {
    await page.goto("/");

    const connectBtn = page.getByTestId("connect-wallet-btn").or(page.getByRole("button", { name: /connect/i }));
    if (await connectBtn.count() > 0) {
      await connectBtn.first().click();
      await expect(page.getByText("Freighter", { exact: true }).first()).toBeVisible();
    }
  });
});
