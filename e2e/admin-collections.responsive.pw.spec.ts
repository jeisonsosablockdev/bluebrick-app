import type { Locator, Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

import {
  ADMIN_COLLECTIONS_PRIMARY_ENTRY_ID,
  enableAdminCollectionsFixture
} from "./helpers/admin-collections-fixture";
import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

type ResponsiveCheckResult = {
  route: "index" | "detail";
  viewport: string;
  horizontalOverflow: boolean;
  primaryActionHeight: number;
};

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

async function measureActionHeight(locator: Locator): Promise<number> {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  return box?.height ?? 0;
}

test("admin collections responsive QA evidence pack", async ({ page }, testInfo) => {
  const availability = getWalletAvailability("admin");
  test.skip(!availability.exists, availability.reason);

  const me = await authenticateWithWalletRole(page, "admin");
  expect(me.authenticated).toBe(true);
  expect(me.role).toBe("admin");

  await enableAdminCollectionsFixture(page);

  const report: ResponsiveCheckResult[] = [];

  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.goto("/admin/collections");
    await expect(page).toHaveURL(/\/admin\/collections$/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1")).toHaveText(/Collections/i);

    const manageProjectLink = page.getByRole("link", { name: /Manage project/i }).first();
    await expect(manageProjectLink).toBeVisible();
    const indexOverflow = await hasHorizontalOverflow(page);
    expect(indexOverflow).toBe(false);
    const manageProjectHeight = await measureActionHeight(manageProjectLink);
    expect(manageProjectHeight).toBeGreaterThanOrEqual(44);

    const indexScreenshotPath = testInfo.outputPath(`admin-collections-index-${viewport.label}.png`);
    await page.screenshot({
      path: indexScreenshotPath,
      fullPage: true
    });
    await testInfo.attach(`admin-collections-index-${viewport.label}`, {
      path: indexScreenshotPath,
      contentType: "image/png"
    });

    report.push({
      route: "index",
      viewport: viewport.label,
      horizontalOverflow: indexOverflow,
      primaryActionHeight: manageProjectHeight
    });

    await manageProjectLink.click();

    await expect(page).toHaveURL(new RegExp(`/admin/collections/${ADMIN_COLLECTIONS_PRIMARY_ENTRY_ID}$`));
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/Managed from Candy Machine/i)).toBeVisible();
    await expect(page.getByText(/Read-only cover/i)).toBeVisible();

    const summarySaveButton = page.getByRole("button", { name: /Save summary/i });
    await expect(summarySaveButton).toBeVisible();
    const detailOverflow = await hasHorizontalOverflow(page);
    expect(detailOverflow).toBe(false);
    const summaryButtonHeight = await measureActionHeight(summarySaveButton);
    expect(summaryButtonHeight).toBeGreaterThanOrEqual(44);

    const detailScreenshotPath = testInfo.outputPath(`admin-collections-detail-${viewport.label}.png`);
    await page.screenshot({
      path: detailScreenshotPath,
      fullPage: true
    });
    await testInfo.attach(`admin-collections-detail-${viewport.label}`, {
      path: detailScreenshotPath,
      contentType: "image/png"
    });

    report.push({
      route: "detail",
      viewport: viewport.label,
      horizontalOverflow: detailOverflow,
      primaryActionHeight: summaryButtonHeight
    });
  }

  const checklistPath = testInfo.outputPath("admin-collections-responsive-checklist.json");
  const checklist = {
    checkedAt: new Date().toISOString(),
    entryId: ADMIN_COLLECTIONS_PRIMARY_ENTRY_ID,
    report
  };
  await fs.writeFile(checklistPath, JSON.stringify(checklist, null, 2), "utf8");

  await testInfo.attach("admin-collections-responsive-checklist", {
    path: checklistPath,
    contentType: "application/json"
  });

  testInfo.annotations.push({
    type: "evidence-path",
    description: path.relative(process.cwd(), testInfo.outputDir)
  });
});
