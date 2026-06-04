import { afterEach, describe, expect, it } from "vitest";

import {
  buildProtectedNavigation,
  isProtectedRouteActive,
  resolveCurrentProtectedModule
} from "@/components/dashboard/protected-shell";
import type { LocaleText } from "@/lib/i18n";

function english(text: LocaleText): string {
  return text.en;
}

const originalNodeEnv = process.env.NODE_ENV;
const originalFlag = process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

function setNodeEnv(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;

  if (typeof value === "undefined") {
    delete env.NODE_ENV;
    return;
  }

  env.NODE_ENV = value;
}

describe("components/dashboard/protected-shell", () => {
  afterEach(() => {
    setNodeEnv(originalNodeEnv);

    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES = originalFlag;
    }
  });

  it("includes a dedicated referral rewards tab in protected navigation", () => {
    setNodeEnv("development");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const navigation = buildProtectedNavigation(english);

    expect(navigation[0]?.href).toBe("/protected");
    expect(navigation[1]?.href).toBe("/protected/referrals");
    expect(navigation[1]?.label).toBe("Referral Rewards");
  });

  it("matches nested protected routes", () => {
    expect(isProtectedRouteActive("/protected/referrals", "/protected/referrals")).toBe(true);
    expect(isProtectedRouteActive("/protected/referrals/detail", "/protected/referrals")).toBe(true);
    expect(isProtectedRouteActive("/protected/portfolio", "/protected/referrals")).toBe(false);
  });

  it("resolves the current protected module from the active route", () => {
    setNodeEnv("development");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const navigation = buildProtectedNavigation(english);

    expect(resolveCurrentProtectedModule("/protected/referrals", navigation).label).toBe("Referral Rewards");
    expect(resolveCurrentProtectedModule("/unknown", navigation).label).toBe("Overview");
  });

  it("hides release-controlled protected modules in production-like builds", () => {
    setNodeEnv("production");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const navigation = buildProtectedNavigation(english);
    const routes = navigation.map((item) => item.href);

    expect(routes).toEqual([
      "/protected",
      "/protected/referrals",
      "/protected/stake",
      "/protected/perfil"
    ]);
  });
});
