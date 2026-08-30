/**
 * @file apps/web/src/features/i18n/infrastructure/cookie-locale-adapter.ts
 * @description Layer 4: Infrastructure - Browser & Server Cookie Storage Adapter for Locale Persistence.
 * Implements LocaleStoragePort using standard browser cookies and Next.js cookies API.
 */

import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from "../domain/models/locale-types";
import type { LocaleStoragePort } from "../domain/ports/i18n-port";

export const LOCALE_COOKIE_NAME = "bb_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Validates whether an arbitrary string is a recognized SupportedLocale.
 */
export function isValidLocale(value: string | null | undefined): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * CookieLocaleAdapter handles reading and writing the `bb_locale` cookie.
 */
export class CookieLocaleAdapter implements LocaleStoragePort {
  /**
   * Retrieves the stored locale from document.cookie in the browser environment.
   */
  getLocale(): SupportedLocale | null {
    // Step 1: Check if running in browser context
    if (typeof document === "undefined") {
      return null;
    }

    // Step 2: Parse document.cookie
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${LOCALE_COOKIE_NAME}=`));

    if (!match) return null;

    const value = match.split("=")[1];
    return isValidLocale(value) ? value : null;
  }

  /**
   * Stores the selected locale in document.cookie with security flags.
   */
  setLocale(locale: SupportedLocale): void {
    // Step 1: Check if running in browser context
    if (typeof document === "undefined") {
      return;
    }

    // Step 2: Set cookie with secure attributes
    const targetLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;
    document.cookie = `${LOCALE_COOKIE_NAME}=${targetLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

export const cookieLocaleAdapter = new CookieLocaleAdapter();
