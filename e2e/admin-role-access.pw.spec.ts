import { expect, test } from "@playwright/test";

import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

test.describe("admin vs user access control", () => {
  test("admin wallet can access /admin", async ({ page }) => {
    const availability = getWalletAvailability("admin");
    test.skip(!availability.exists, availability.reason);

    const me = await authenticateWithWalletRole(page, "admin");

    expect(me.authenticated).toBe(true);
    expect(me.role).toBe("admin");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toContainText(/Admin/i);
    await expect(page.getByText(/Access denied|Acceso denegado|Acesso negado/)).toHaveCount(0);
  });

  test("non-admin wallet is blocked from /admin", async ({ page }) => {
    const availability = getWalletAvailability("user");
    test.skip(!availability.exists, availability.reason);

    const me = await authenticateWithWalletRole(page, "user");

    expect(me.authenticated).toBe(true);
    expect(me.role).toBe("user");

    await page.goto("/admin");

    await expect(page.getByText(/Access denied|Acceso denegado|Acesso negado/)).toBeVisible();
    await expect(page.getByText(/Admin Console|Consola Admin|Console Admin/)).toHaveCount(0);
  });
});
