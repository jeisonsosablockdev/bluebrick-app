import { expect, test } from "@playwright/test";

test("wallet modal shows direct Mail and Wallet entry actions", async ({ page }, testInfo) => {
  await page.goto("/");

  const openButton = page.getByRole("button", {
    name: /Sign in|Ingresar|Entrar|Wallet|Cuenta|Account|Conta/
  }).first();

  await openButton.click();

  const dialog = page.getByRole("dialog", {
    name: /Access your account|Accede a tu cuenta|Acesse sua conta/
  });

  await expect(dialog).toBeVisible();
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
