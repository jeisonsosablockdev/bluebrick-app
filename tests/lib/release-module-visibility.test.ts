import { afterEach, describe, expect, it } from "vitest";

import {
  areDevOnlyModulesVisible,
  isAdminReleaseControlledRoute,
  isProtectedReleaseControlledRoute,
  isReleaseControlledRouteVisible
} from "@/lib/release-module-visibility";

const originalNodeEnv = process.env.NODE_ENV;
const originalFlag = process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

function setNodeEnv(value: string | undefined): void {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true
  });
}

describe("lib/release-module-visibility", () => {
  afterEach(() => {
    setNodeEnv(originalNodeEnv);

    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES = originalFlag;
    }
  });

  it("keeps dev-only modules visible by default outside production", () => {
    setNodeEnv("development");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    expect(areDevOnlyModulesVisible()).toBe(true);
  });

  it("hides dev-only modules by default in production-like builds", () => {
    setNodeEnv("production");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    expect(areDevOnlyModulesVisible()).toBe(false);
  });

  it("allows explicit reactivation through the public flag", () => {
    setNodeEnv("production");
    process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES = "true";

    expect(areDevOnlyModulesVisible()).toBe(true);
  });

  it("identifies protected and admin release-controlled routes", () => {
    expect(isProtectedReleaseControlledRoute("/protected/stake")).toBe(true);
    expect(isProtectedReleaseControlledRoute("/protected")).toBe(false);
    expect(isAdminReleaseControlledRoute("/admin/settings")).toBe(true);
    expect(isAdminReleaseControlledRoute("/admin/dashboard")).toBe(false);
  });

  it("keeps non-controlled routes visible even when release-controlled modules are hidden", () => {
    setNodeEnv("production");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    expect(isReleaseControlledRouteVisible("/protected")).toBe(true);
    expect(isReleaseControlledRouteVisible("/admin/dashboard")).toBe(true);
    expect(isReleaseControlledRouteVisible("/protected/historial")).toBe(false);
    expect(isReleaseControlledRouteVisible("/admin/treasury")).toBe(false);
  });
});
