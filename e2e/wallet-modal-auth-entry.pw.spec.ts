import { expect, test, type Page } from "@playwright/test";

const MODAL_VIEWPORT_WIDTHS = [320, 375, 768, 1024] as const;
const MODAL_VIEWPORT_ROUTES = ["/", "/marketplace"] as const;

async function openWalletModal(page: Page) {
  const openButton = page.getByRole("button", {
    name: /Sign in|Ingresar|Entrar|Wallet|Cuenta|Account|Conta/
  }).first();

  await openButton.click();

  const dialog = page.getByRole("dialog", {
    name: /Access your account|Accede a tu cuenta|Acesse sua conta/
  });

  await expect(dialog).toBeVisible();

  return dialog;
}

test("wallet modal shows direct Mail and Wallet entry actions", async ({ page }, testInfo) => {
  await page.goto("/");

  const dialog = await openWalletModal(page);
  await expect(dialog.getByText(/Access your BRIDS account|Ingresa a tu cuenta BRIDS|Entre na sua conta BRIDS/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Mail", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Wallet", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Connect & Sign in|Conectar e iniciar sesion|Conectar e entrar/ })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: /Enter your referral code|Ingresa tu codigo de referido|Digite seu codigo de indicacao/ })).toBeVisible();

  const screenshotPath = testInfo.outputPath("wallet-modal-direct-auth-entry.png");
  await dialog.screenshot({ path: screenshotPath });

  await testInfo.attach("wallet-modal-direct-auth-entry", {
    path: screenshotPath,
    contentType: "image/png"
  });
});

for (const route of MODAL_VIEWPORT_ROUTES) {
  for (const width of MODAL_VIEWPORT_WIDTHS) {
    test(`wallet modal remains viewport anchored on ${route} at ${width}px`, async ({ page }, testInfo) => {
      const height = 720;
      await page.setViewportSize({ width, height });
      await page.goto(route);
      await page.evaluate(() => window.scrollTo(0, 0));

      const scrollBeforeOpen = await page.evaluate(() => window.scrollY);
      const dialog = await openWalletModal(page);
      const scrollAfterOpen = await page.evaluate(() => window.scrollY);
      const box = await dialog.boundingBox();

      expect(scrollAfterOpen).toBe(scrollBeforeOpen);
      expect(box).not.toBeNull();
      expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(height);

      const screenshotPath = testInfo.outputPath(`wallet-modal-${route === "/" ? "home" : "marketplace"}-${width}.png`);
      await dialog.screenshot({ path: screenshotPath });

      await testInfo.attach(`wallet-modal-${route}-${width}`, {
        path: screenshotPath,
        contentType: "image/png"
      });
    });
  }
}
