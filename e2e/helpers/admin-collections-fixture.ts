import type { Page } from "@playwright/test";

export const ADMIN_COLLECTIONS_FIXTURE_COOKIE_NAME = "brids_admin_collections_fixture";
export const ADMIN_COLLECTIONS_FIXTURE_COOKIE_VALUE = "bri-101";
export const ADMIN_COLLECTIONS_PRIMARY_ENTRY_ID = "entry-bri-101-primary";

export async function enableAdminCollectionsFixture(page: Page): Promise<void> {
  const url = new URL(page.url());
  await page.context().addCookies([
    {
      name: ADMIN_COLLECTIONS_FIXTURE_COOKIE_NAME,
      value: ADMIN_COLLECTIONS_FIXTURE_COOKIE_VALUE,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax"
    }
  ]);
}

export async function waitForAppSplashToClear(page: Page): Promise<void> {
  const splash = page.getByRole("status", { name: /BRIDS loading screen/i });
  await splash.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
}
