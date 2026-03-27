import { expect, test } from "@playwright/test";

import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

test("admin /admin/assets/new responsive QA checklist", async ({ page }, testInfo) => {
  const availability = getWalletAvailability("admin");
  test.skip(!availability.exists, availability.reason);

  const me = await authenticateWithWalletRole(page, "admin");
  expect(me.authenticated).toBe(true);
  expect(me.role).toBe("admin");

  await page.goto("/admin/assets/new");
  await expect(page).toHaveURL(/\/admin\/assets\/new$/);

  const continueToMintButton = page.getByRole("button", {
    name: /Continue to mint|Continuar a mint|Continuar para mint/i
  });

  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload({ waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/admin\/assets\/new$/);

    await expect(page.locator("main")).toBeVisible();
    await expect(continueToMintButton).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    await continueToMintButton.scrollIntoViewIfNeeded();
    const continueToMintBox = await continueToMintButton.boundingBox();
    expect(continueToMintBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const screenshotPath = testInfo.outputPath(`admin-assets-new-${viewport.label}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    await testInfo.attach(`admin-assets-new-${viewport.label}`, {
      path: screenshotPath,
      contentType: "image/png"
    });
  }
});
