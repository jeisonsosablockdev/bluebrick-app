import path from "node:path";

import { expect, test } from "@playwright/test";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

test("capture critical-path evidence across required responsive widths", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();

  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload({ waitUntil: "networkidle" });

    await expect(page.locator("main")).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    const screenshotPath = testInfo.outputPath(`${viewport.label}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    await testInfo.attach(`evidence-${viewport.label}`, {
      path: screenshotPath,
      contentType: "image/png"
    });
  }

  const metadataPath = testInfo.outputPath("responsive-checklist.json");
  await testInfo.attach("responsive-checklist", {
    body: Buffer.from(
      JSON.stringify(
        {
          checkedAt: new Date().toISOString(),
          baseUrl: page.url(),
          viewports: responsiveViewports
        },
        null,
        2
      )
    ),
    contentType: "application/json"
  });

  await page.context().storageState({ path: metadataPath });
  await testInfo.attach("storage-state-snapshot", {
    path: metadataPath,
    contentType: "application/json"
  });

  testInfo.annotations.push({
    type: "evidence-path",
    description: path.relative(process.cwd(), testInfo.outputDir)
  });
});
