import { expect, test } from "@playwright/test";

import {
  ADMIN_COLLECTIONS_PRIMARY_ENTRY_ID,
  enableAdminCollectionsFixture,
  waitForAppSplashToClear
} from "./helpers/admin-collections-fixture";
import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

const PRIMARY_ENTRY_ID = ADMIN_COLLECTIONS_PRIMARY_ENTRY_ID;

test.describe("admin collections primary flow", () => {
  test("covers index access, health queue visibility, and detail entry", async ({
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

    await expect(page.locator("h1")).toHaveText(/Collections/i);
    await expect(page.getByText("Oceanview Fractional Tower")).toBeVisible();
    await expect(page.getByText("Harbor Reserve Phase II")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Open health queue/i })).toBeVisible();

    await page.goto(`/admin/collections/${PRIMARY_ENTRY_ID}`);
    await waitForAppSplashToClear(page);

    await expect(page).toHaveURL(new RegExp(`/admin/collections/${PRIMARY_ENTRY_ID}$`));
    await expect(page.getByText(/Managed from Candy Machine/i)).toBeVisible();
    await expect(page.getByText(/Read-only cover/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Save cover/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Save summary/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Save property information/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Save location/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Save documents/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Blockchain addresses/i })).toBeVisible();
  });
});
