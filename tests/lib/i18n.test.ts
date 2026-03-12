import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, normalizeLocale, resolveLocaleFromAcceptLanguage, resolveRequestedLocale } from "@/lib/i18n";

describe("lib/i18n", () => {
  it("normalizes supported locale values", () => {
    expect(normalizeLocale("es")).toBe("es");
    expect(normalizeLocale("EN-us")).toBe("en");
    expect(normalizeLocale("pt-BR")).toBe("pt");
  });

  it("rejects unsupported locale values", () => {
    expect(normalizeLocale("fr")).toBeNull();
    expect(normalizeLocale("de-DE")).toBeNull();
    expect(normalizeLocale("")).toBeNull();
  });

  it("picks locale from Accept-Language header in priority order", () => {
    expect(resolveLocaleFromAcceptLanguage("fr-CA,pt-BR;q=0.9,en;q=0.8")).toBe("pt");
    expect(resolveLocaleFromAcceptLanguage("de,fr;q=0.9")).toBeNull();
  });

  it("resolves requested locale with cookie precedence and fallback", () => {
    expect(resolveRequestedLocale({ cookieValue: "pt", acceptLanguage: "en-US,en;q=0.9" })).toBe("pt");
    expect(resolveRequestedLocale({ cookieValue: null, acceptLanguage: "en-US,en;q=0.9" })).toBe("en");
    expect(resolveRequestedLocale({ cookieValue: null, acceptLanguage: "fr-CA,fr;q=0.9" })).toBe(DEFAULT_LOCALE);
  });
});
