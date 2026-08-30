/**
 * @file apps/web/src/features/i18n/infrastructure/browser-locale-detector.ts
 * @description Layer 4: Infrastructure - Client-Side Navigator Locale Detector.
 * Safely inspects navigator.languages to identify preferred user language.
 */

import { DEFAULT_LOCALE, type SupportedLocale } from "../domain/models/locale-types";
import { isValidLocale } from "./cookie-locale-adapter";
import type { LocaleDetectorPort } from "../domain/ports/i18n-port";

/**
 * Functional adapter implementing LocaleDetectorPort using standard browser APIs.
 */
export const browserLocaleDetector: LocaleDetectorPort = {
  detectLocale(): SupportedLocale {
    // Step 1: Guard against SSR / Node environments
    if (typeof navigator === "undefined") {
      return DEFAULT_LOCALE;
    }

    // Step 2: Extract candidate languages from navigator
    const languages = navigator.languages || [navigator.language];

    // Step 3: Find first valid supported locale code
    for (const lang of languages) {
      if (!lang) continue;
      const primaryCode = lang.split("-")[0].toLowerCase();
      if (isValidLocale(primaryCode)) {
        return primaryCode;
      }
    }

    // Step 4: Default fallback
    return DEFAULT_LOCALE;
  },
};
