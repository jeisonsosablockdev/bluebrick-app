/**
 * @file tests/unit/i18n-cookie-adapter.test.ts
 * @description Layer 4 & QA: Behavioral Unit Test Suite for Cookie Storage Adapter and Browser Locale Detector.
 * @spec BBC-009-COOKIE-ADAPTER
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  CookieLocaleAdapter,
  isValidLocale,
  LOCALE_COOKIE_NAME,
} from "@/features/i18n/infrastructure/cookie-locale-adapter";
import { browserLocaleDetector } from "@/features/i18n/infrastructure/browser-locale-detector";

describe("BBC-009: Cookie Locale Adapter & Browser Detector (@spec BBC-009-COOKIE-ADAPTER)", () => {
  let cookieAdapter: CookieLocaleAdapter;

  beforeEach(() => {
    cookieAdapter = new CookieLocaleAdapter();
    // Reset document cookie
    if (typeof document !== "undefined") {
      document.cookie = `${LOCALE_COOKIE_NAME}=; max-age=0; path=/`;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isValidLocale", () => {
    it("should return true for supported locales", () => {
      expect(isValidLocale("es")).toBe(true);
      expect(isValidLocale("en")).toBe(true);
      expect(isValidLocale("pt")).toBe(true);
    });

    it("should return false for unsupported or malformed locales", () => {
      expect(isValidLocale("fr")).toBe(false);
      expect(isValidLocale("de")).toBe(false);
      expect(isValidLocale("")).toBe(false);
      expect(isValidLocale(null)).toBe(false);
      expect(isValidLocale(undefined)).toBe(false);
    });
  });

  describe("CookieLocaleAdapter", () => {
    it("should return null when no cookie is set", () => {
      expect(cookieAdapter.getLocale()).toBeNull();
    });

    it("should read and return valid stored locale from document.cookie", () => {
      document.cookie = `${LOCALE_COOKIE_NAME}=en; path=/`;
      expect(cookieAdapter.getLocale()).toBe("en");

      document.cookie = `${LOCALE_COOKIE_NAME}=pt; path=/`;
      expect(cookieAdapter.getLocale()).toBe("pt");
    });

    it("should return null if stored cookie value is invalid", () => {
      document.cookie = `${LOCALE_COOKIE_NAME}=invalid_code; path=/`;
      expect(cookieAdapter.getLocale()).toBeNull();
    });

    it("should set document.cookie with valid locale and secure attributes", () => {
      cookieAdapter.setLocale("en");
      expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=en`);

      cookieAdapter.setLocale("pt");
      expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=pt`);
    });
  });

  describe("BrowserLocaleDetector", () => {
    it("should detect English when navigator.languages starts with en", () => {
      vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US", "en"]);
      expect(browserLocaleDetector.detectLocale()).toBe("en");
    });

    it("should detect Portuguese when navigator.languages starts with pt", () => {
      vi.spyOn(navigator, "languages", "get").mockReturnValue(["pt-BR", "pt"]);
      expect(browserLocaleDetector.detectLocale()).toBe("pt");
    });

    it("should detect Spanish when navigator.languages starts with es", () => {
      vi.spyOn(navigator, "languages", "get").mockReturnValue(["es-CO", "es"]);
      expect(browserLocaleDetector.detectLocale()).toBe("es");
    });

    it("should fallback to default Spanish (es) when browser language is unsupported", () => {
      vi.spyOn(navigator, "languages", "get").mockReturnValue(["ja-JP", "ja", "zh"]);
      expect(browserLocaleDetector.detectLocale()).toBe("es");
    });
  });
});
