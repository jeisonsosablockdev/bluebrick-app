import { expect, test } from "@playwright/test";

import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

test("admin notifications console is responsive across required widths", async ({ page }, testInfo) => {
  const availability = getWalletAvailability("admin");
  test.skip(!availability.exists, availability.reason);

  const me = await authenticateWithWalletRole(page, "admin");
  expect(me.authenticated).toBe(true);
  expect(me.role).toBe("admin");

  const responsiveReport: Array<{ viewport: string; horizontalOverflow: boolean }> = [];

  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/admin/notifications");
    await expect(page.getByText(/Push campaigns|Campanas push|Campanhas push/)).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);

    responsiveReport.push({
      viewport: viewport.label,
      horizontalOverflow: hasHorizontalOverflow
    });
  }

  await testInfo.attach("admin-notifications-responsive-report", {
    body: Buffer.from(JSON.stringify({ generatedAt: new Date().toISOString(), responsiveReport }, null, 2)),
    contentType: "application/json"
  });
});
