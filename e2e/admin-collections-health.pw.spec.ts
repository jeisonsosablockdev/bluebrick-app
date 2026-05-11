import { expect, test } from "@playwright/test";

import { enableAdminCollectionsFixture, waitForAppSplashToClear } from "./helpers/admin-collections-fixture";
import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

test("admin collections health queue keeps degraded rows out of the main workspace", async ({
  page
}) => {
  const availability = getWalletAvailability("admin");
  test.skip(!availability.exists, availability.reason);

  const me = await authenticateWithWalletRole(page, "admin");
  expect(me.authenticated).toBe(true);
  expect(me.role).toBe("admin");

  await enableAdminCollectionsFixture(page);

  await page.goto("/admin/collections");
  await waitForAppSplashToClear(page);

  await expect(page.getByText("Oceanview Fractional Tower")).toBeVisible();
  await expect(page.getByText("Harbor Reserve Phase II")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Open health queue/i })).toHaveAttribute(
    "href",
    "/admin/health/collections"
  );
  await page.goto("/admin/health/collections");
  await waitForAppSplashToClear(page);

  await expect(page).toHaveURL(/\/admin\/health\/collections$/);
  await expect(page.locator("h1")).toHaveText(/Collections health/i);
  await expect(page.getByText("Harbor Reserve Phase II")).toBeVisible();
  await expect(page.getByText(/No linked asset mint snapshot/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /View collection context/i })).toBeVisible();
});
