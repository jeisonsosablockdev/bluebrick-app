import { expect, test } from "@playwright/test";

test("home page renders the core shell", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("section").first()).toBeVisible();
});
