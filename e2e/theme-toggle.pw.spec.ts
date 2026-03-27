import { expect, test } from "@playwright/test";

test("theme toggle switches between dark and light mode and persists", async ({ page }) => {
  await page.goto("/");

  const toggle = page.getByRole("button", {
    name: /Toggle color theme|Cambiar tema de color|Alternar tema de cor/i
  });

  await expect(toggle).toBeVisible();

  const toggleBox = await toggle.boundingBox();
  expect(toggleBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await expect
    .poll(async () => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
    .toBe("dark");

  await toggle.click();

  await expect
    .poll(async () => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
    .toBe("light");

  await page.reload({ waitUntil: "networkidle" });

  await expect
    .poll(async () => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
    .toBe("light");

  await toggle.click();

  await expect
    .poll(async () => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
    .toBe("dark");
});
