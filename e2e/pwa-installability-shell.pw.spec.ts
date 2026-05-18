import { expect, test } from "@playwright/test";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

test("pwa installability shell exposes manifest, metadata, service worker, and responsive safety", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(manifestHref).toBe("/manifest.webmanifest");

  const appleTouchIconHref = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  expect(appleTouchIconHref).toContain("/apple-icon");

  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);

  const manifest = await manifestResponse.json();
  expect(manifest).toMatchObject({
    display: "standalone",
    start_url: "/?source=pwa"
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: "/pwa-icons/192",
        sizes: "192x192"
      }),
      expect.objectContaining({
        src: "/pwa-icons/512",
        sizes: "512x512"
      })
    ])
  );

  await page.waitForFunction(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    return Boolean(registration);
  });

  const responsiveReport: Array<{ viewport: string; horizontalOverflow: boolean }> = [];

  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalOverflow).toBe(false);

    responsiveReport.push({
      viewport: viewport.label,
      horizontalOverflow: hasHorizontalOverflow
    });
  }

  const screenshotPath = testInfo.outputPath("pwa-installability-shell-home.png");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  await testInfo.attach("pwa-installability-shell-home", {
    path: screenshotPath,
    contentType: "image/png"
  });
  await testInfo.attach("pwa-installability-shell-report", {
    body: Buffer.from(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          responsiveReport
        },
        null,
        2
      )
    ),
    contentType: "application/json"
  });
});
