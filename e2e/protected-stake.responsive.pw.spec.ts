import { expect, test } from "@playwright/test";

import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "mobile-wide-640", width: 640, height: 812 },
  { label: "mobile-wide-700", width: 700, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

const responsiveStakeItems = [
  {
    assetAddress: "4tXx1W2LbuxJaq6QP4eF24KrbBcc7pU2fVkV1YdaiLbJ",
    propertyId: "property-hunter-1",
    propertyTitle: "Fix & Flip 518 HUNTER LN 518",
    collectionAddress: "HDRjX5dn5XHVpGbfnoo8GXd5kS8hTs8wt4W98PrbzHT9",
    candyMachineAddress: "CandyMachineMobileOverflow111111111111111111111",
    displayName: "Fix Flip 518 HUNTER LN 518 #1",
    imageUrl: null,
    visibleState: "ready_to_unstake",
    action: "Unstake",
    isFrozen: true,
    syncPending: false
  },
  {
    assetAddress: "32Nh9pbheb2cryvNMUWbQBZBywYsvBa9TybRwE7Qzhvy",
    propertyId: "property-brandon-1",
    propertyTitle: "Fix & Flip Brandon 117",
    collectionAddress: "HDRjX5dn5XHVpGbfnoo8GXd5kS8hTs8wt4W98PrbzHT9",
    candyMachineAddress: "CandyMachineMobileOverflow222222222222222222222",
    displayName: "Fix Flip Brandon 117 #1",
    imageUrl: null,
    visibleState: "ready_to_unstake",
    action: "Unstake",
    isFrozen: true,
    syncPending: false
  },
  {
    assetAddress: "12dbThcSbsv1HmVFEc388oiB5BFXVyxzP8ZPwprVDbrt",
    propertyId: "property-hunter-2",
    propertyTitle: "Fix & Flip 518 HUNTER LN 518",
    collectionAddress: "HDRjX5dn5XHVpGbfnoo8GXd5kS8hTs8wt4W98PrbzHT9",
    candyMachineAddress: "CandyMachineMobileOverflow333333333333333333333",
    displayName: "Fix Flip 518 HUNTER LN 518 #2",
    imageUrl: null,
    visibleState: "ready_to_stake",
    action: "Stake",
    isFrozen: false,
    syncPending: false
  }
] as const;

function expectInsideViewport(input: {
  label: string;
  viewportWidth: number;
  box: { x: number; width: number } | null;
}): void {
  expect(input.box, `${input.label} should be measurable`).not.toBeNull();

  if (!input.box) {
    return;
  }

  expect(input.box.x, `${input.label} should not overflow left`).toBeGreaterThanOrEqual(0);
  expect(input.box.x + input.box.width, `${input.label} should not overflow right`).toBeLessThanOrEqual(input.viewportWidth);
}

test("protected stake cards keep long NFT identifiers inside the viewport", async ({ page }, testInfo) => {
  const availability = getWalletAvailability("user");
  test.skip(!availability.exists, availability.reason);

  const me = await authenticateWithWalletRole(page, "user");
  expect(me.authenticated).toBe(true);
  expect(me.pubkey).toBeTruthy();

  await page.route("**/api/protected/stake/assets", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        data: {
          walletPublicKey: me.pubkey,
          items: responsiveStakeItems
        }
      })
    });
  });

  const responsiveReport: Array<{ viewport: string; horizontalOverflow: boolean }> = [];

  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/protected/stake");

    await expect(page.getByText("Fractions eligible for Stake / Unstake")).toBeVisible();
    await expect(page.getByText(responsiveStakeItems[0].assetAddress)).toBeVisible();
    await expect(page.getByText(responsiveStakeItems[1].assetAddress)).toBeVisible();
    await expect(page.getByText(responsiveStakeItems[2].assetAddress)).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    for (const item of responsiveStakeItems) {
      const stakeCard = page.getByText(item.assetAddress).locator("xpath=ancestor::article[1]");
      const cardBox = await stakeCard.boundingBox();
      expectInsideViewport({ label: `${viewport.label} ${item.assetAddress} card`, viewportWidth: viewport.width, box: cardBox });

      const buttonBox = await stakeCard.getByRole("button", { name: item.action }).boundingBox();
      expectInsideViewport({ label: `${viewport.label} ${item.assetAddress} action button`, viewportWidth: viewport.width, box: buttonBox });
      expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

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
