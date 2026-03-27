import { defineWalletSetup } from "@synthetixio/synpress";
import { Phantom } from "@synthetixio/synpress/playwright";

import { tryLoadWalletProfile } from "./solana-wallet-profiles.mjs";

const walletPassword = process.env.E2E_PHANTOM_PASSWORD ?? "TestPhantomPassword123!";
const seedPhrase =
  process.env.E2E_PHANTOM_SEED_PHRASE ??
  "test test test test test test test test test test test junk";

export default defineWalletSetup(walletPassword, async (context, walletPage) => {
  const phantom = new Phantom(context, walletPage, walletPassword);

  await phantom.importWallet(seedPhrase);
  const finishOnboardingButton = walletPage.locator('[data-testid="onboarding-complete-done"]');

  if (await finishOnboardingButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await finishOnboardingButton.click();
  }

  const walletProfile = tryLoadWalletProfile("admin");

  if (!walletProfile) {
    return;
  }

  const accountMenuButton = walletPage.locator('[data-testid="settings-menu-open-button"]');
  const canImportSecondaryAccount = await accountMenuButton.isVisible({ timeout: 5000 }).catch(() => false);

  if (!canImportSecondaryAccount) {
    return;
  }

  await phantom.importWalletFromPrivateKey("solana", walletProfile.privateKeyBase58, "admin-wallet");
  await phantom.switchAccount("admin-wallet");
});
