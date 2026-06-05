import { expect, test } from "@playwright/test";

import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

test("protected stake cards keep long NFT identifiers inside the viewport", async ({ page }, testInfo) => {
  const availability = getWalletAvailability("user");
  test.skip(!availability.exists, availability.reason);

  const me = await authenticateWithWalletRole(page, "user");
  expect(me.authenticated).toBe(true);
  expect(me.pubkey).toBeTruthy();

  const longAssetAddress = "12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt";

  await page.route("**/api/protected/stake/assets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          walletPublicKey: me.pubkey,
          items: [
            {
              assetAddress: longAssetAddress,
              propertyId: "property-mobile-overflow",
              propertyTitle: "Fix & Flip 518 HUNTER LN 518 With Extra Mobile Width Pressure",
              collectionAddress: "HDRjX5dn5XHVpGbfnoo8GXd5kS8hTs8wt4W98PrbzHT9",
              candyMachineAddress: "CandyMachineMobileOverflow111111111111111111111",
              displayName: "Fix Flip 518 HUNTER LN 518 #2 Very Long Fraction Label",
              imageUrl: null,
              visibleState: "ready_to_unstake",
              action: "Unstake",
              isFrozen: true,
              syncPending: false
            }
          ]
        }
      })
    });
  });

  const responsiveReport: Array<{ viewport: string; horizontalOverflow: boolean }> = [];

  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/protected/stake");

    await expect(page.getByText("Fractions eligible for Stake / Unstake")).toBeVisible();
    await expect(page.getByText(longAssetAddress)).toBeVisible();
    await expect(page.getByRole("button", { name: "Unstake" })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    const buttonBox = await page.getByRole("button", { name: "Unstake" }).boundingBox();
    expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const screenshotPath = testInfo.outputPath(`protected-stake-${viewport.label}.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    await testInfo.attach(`protected-stake-${viewport.label}`, {
      path: screenshotPath,
      contentType: "image/png"
    });

    responsiveReport.push({
      viewport: viewport.label,
      horizontalOverflow: hasHorizontalOverflow
    });
  }

  await testInfo.attach("protected-stake-responsive-report", {
    body: Buffer.from(JSON.stringify({ generatedAt: new Date().toISOString(), responsiveReport }, null, 2)),
    contentType: "application/json"
  });
});
