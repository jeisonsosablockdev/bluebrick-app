import { expect } from "@playwright/test";
import { testWithSynpress } from "@synthetixio/synpress";
import { phantomFixtures } from "@synthetixio/synpress/playwright";

import adminWalletSetup from "../test/wallet-setup/phantom.admin.setup.mjs";
import userWalletSetup from "../test/wallet-setup/phantom.user.setup.mjs";

const walletRole = (process.env.E2E_SYNPRESS_WALLET_ROLE ?? "user").trim().toLowerCase();
const selectedWalletSetup = walletRole === "admin" ? adminWalletSetup : userWalletSetup;

const test = testWithSynpress(phantomFixtures(selectedWalletSetup));

test("phantom cache boots and the app shell loads", async ({ page }) => {
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("main")).toBeVisible();
});
