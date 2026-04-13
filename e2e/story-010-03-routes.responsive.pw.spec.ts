import { expect, test } from "@playwright/test";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

const routesToCheck = [
  "/about",
  "/platform",
  "/software",
  "/regulatory",
  "/knowledge",
  "/knowledge/articles/tokenization-fundamentals",
  "/knowledge/faq",
  "/knowledge/definitions/yield",
  "/resources/changelog-v1"
] as const;

test("story-010-03 responsive route architecture QA", async ({ page }, testInfo) => {
  const report: Array<{ route: string; viewport: string; horizontalOverflow: boolean }> = [];

  for (const route of routesToCheck) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();

    for (const viewport of responsiveViewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("main")).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(hasHorizontalOverflow).toBe(false);

      report.push({
        route,
        viewport: viewport.label,
        horizontalOverflow: hasHorizontalOverflow
      });

      if (route === "/knowledge") {
        const links = page.locator('[data-testid="knowledge-hub-link"]');
        const linkCount = await links.count();
        expect(linkCount).toBeGreaterThan(0);

        for (let index = 0; index < linkCount; index += 1) {
          const link = links.nth(index);
          await link.scrollIntoViewIfNeeded();
          const box = await link.boundingBox();
          expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
        }
      }
    }

    await page.setViewportSize({ width: 1024, height: 768 });
    const screenshotPath = testInfo.outputPath(`story-010-03-${route.replaceAll("/", "_") || "home"}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    await testInfo.attach(`story-010-03-${route}`, {
      path: screenshotPath,
      contentType: "image/png"
    });
  }

  await testInfo.attach("story-010-03-responsive-report", {
    body: Buffer.from(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          routes: routesToCheck,
          viewports: responsiveViewports,
          checks: report
        },
        null,
        2
      )
    ),
    contentType: "application/json"
  });
});
