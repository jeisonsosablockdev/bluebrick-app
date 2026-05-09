import { describe, expect, it } from "vitest";

import {
  buildProtectedNavigation,
  isProtectedRouteActive,
  resolveCurrentProtectedModule
} from "@/components/dashboard/protected-shell";
import type { LocaleText } from "@/lib/i18n";

function english(text: LocaleText): string {
  return text.en;
}

describe("components/dashboard/protected-shell", () => {
  it("includes a dedicated referral rewards tab in protected navigation", () => {
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
    const navigation = buildProtectedNavigation(english);

    expect(resolveCurrentProtectedModule("/protected/referrals", navigation).label).toBe("Referral Rewards");
    expect(resolveCurrentProtectedModule("/unknown", navigation).label).toBe("Overview");
  });
});
