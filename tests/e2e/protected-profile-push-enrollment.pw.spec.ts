import { expect, test } from "@playwright/test";

import { authenticateWithWalletRole, getWalletAvailability } from "./helpers/siws-local-wallet";

const responsiveViewports = [
  { label: "mobile-320", width: 320, height: 640 },
  { label: "mobile-375", width: 375, height: 812 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "desktop-1024", width: 1024, height: 768 }
] as const;

test("protected profile exposes push enrollment controls across required widths", async ({ page }, testInfo) => {
  const availability = getWalletAvailability("user");
  test.skip(!availability.exists, availability.reason);

  const me = await authenticateWithWalletRole(page, "user");
  expect(me.authenticated).toBe(true);

  const responsiveReport: Array<{ viewport: string; horizontalOverflow: boolean }> = [];

  for (const viewport of responsiveViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/protected/perfil");
    await expect(page.getByText(/Installability \/ Push readiness|Instalabilidad \/ Preparacion push|Instalabilidade \/ Preparacao push/)).toBeVisible();
    await expect(page.getByText(/Enable notifications|Disable notifications|Add to Home Screen|Activar notificaciones|Desactivar notificaciones|Anadir a pantalla de inicio|Ativar notificacoes|Desativar notificacoes|Adicionar a Tela de Inicio/)).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHorizontalOverflow).toBe(false);

    responsiveReport.push({
      viewport: viewport.label,
      horizontalOverflow: hasHorizontalOverflow
    });
  }

  const screenshotPath = testInfo.outputPath("protected-profile-push-enrollment.png");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/protected/perfil");
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  await testInfo.attach("protected-profile-push-enrollment", {
    path: screenshotPath,
    contentType: "image/png"
  });
  await testInfo.attach("protected-profile-push-enrollment-report", {
    body: Buffer.from(JSON.stringify({ generatedAt: new Date().toISOString(), responsiveReport }, null, 2)),
    contentType: "application/json"
  });
});
