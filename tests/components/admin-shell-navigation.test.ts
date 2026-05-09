import { afterEach, describe, expect, it } from "vitest";

import {
  buildAdminNavigation,
  isAdminRouteActive,
  resolveCurrentAdminLabel
} from "@/components/admin/admin-shell-navigation";
import type { LocaleText } from "@/lib/i18n";

function english(text: LocaleText): string {
  return text.en;
}

const originalNodeEnv = process.env.NODE_ENV;
const originalFlag = process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

function setNodeEnv(value: string | undefined): void {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true
  });
}

describe("components/admin/admin-shell-navigation", () => {
  afterEach(() => {
    setNodeEnv(originalNodeEnv);

    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES = originalFlag;
    }
  });

  it("keeps admin navigation localized and ordered", () => {
    setNodeEnv("development");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const navigation = buildAdminNavigation(english);

    expect(navigation[0]?.section).toBe("General");
    expect(navigation[0]?.items[0]?.label).toBe("Overview");
    expect(navigation[1]?.items[2]?.route).toBe("/admin/collections");
  });

  it("matches nested admin routes", () => {
    expect(isAdminRouteActive("/admin/collections/entry-1", "/admin/collections")).toBe(true);
    expect(isAdminRouteActive("/admin/assets", "/admin/collections")).toBe(false);
  });

  it("resolves the current label from the active route", () => {
    setNodeEnv("development");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const navigation = buildAdminNavigation(english);

    expect(resolveCurrentAdminLabel("/admin/collections/entry-1", navigation)).toBe("Collections");
    expect(resolveCurrentAdminLabel("/unknown", navigation)).toBe("Overview");
  });

  it("hides release-controlled admin modules in production-like builds", () => {
    setNodeEnv("production");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const navigation = buildAdminNavigation(english);
    const routes = navigation.flatMap((section) => section.items.map((item) => item.route));

    expect(routes).toEqual([
      "/admin/dashboard",
      "/admin/assets",
      "/admin/assets/new",
      "/admin/compliance",
      "/admin/collections",
      "/admin/health/collections",
      "/admin/sales",
      "/admin/monitoring"
    ]);
  });
});
