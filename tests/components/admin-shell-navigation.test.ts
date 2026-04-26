import { describe, expect, it } from "vitest";

import {
  buildAdminNavigation,
  isAdminRouteActive,
  resolveCurrentAdminLabel
} from "@/components/admin/admin-shell-navigation";
import type { LocaleText } from "@/lib/i18n";

function english(text: LocaleText): string {
  return text.en;
}

describe("components/admin/admin-shell-navigation", () => {
  it("keeps admin navigation localized and ordered", () => {
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
    const navigation = buildAdminNavigation(english);

    expect(resolveCurrentAdminLabel("/admin/collections/entry-1", navigation)).toBe("Collections");
    expect(resolveCurrentAdminLabel("/unknown", navigation)).toBe("Overview");
  });
});
