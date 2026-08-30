/**
 * @file apps/web/src/features/i18n/application/actions/locale-cookie-actions.ts
 * @description Layer 2: Application - Server Actions for Setting and Getting Locale Preference Cookie.
 */

"use server";

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type SupportedLocale } from "../../domain/models/locale-types";
import { LOCALE_COOKIE_NAME, LOCALE_COOKIE_MAX_AGE, isValidLocale } from "../../infrastructure/cookie-locale-adapter";

/**
 * Server Action to set the user's preferred locale in HTTP cookies.
 *
 * @param locale - Supported language code to persist.
 */
export async function setLocaleCookie(locale: SupportedLocale): Promise<{ success: boolean; locale: SupportedLocale }> {
  // Step 1: Validate incoming locale value
  const targetLocale = isValidLocale(locale) ? locale : DEFAULT_LOCALE;

  // Step 2: Await cookies store in Next.js 16
  const cookieStore = await cookies();

  // Step 3: Write cookie with security flags
  cookieStore.set(LOCALE_COOKIE_NAME, targetLocale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: false, // Accessible client-side for instant hydration
  });

  return { success: true, locale: targetLocale };
}

/**
 * Server Action to read the current locale preference from HTTP cookies.
 *
 * @returns {Promise<SupportedLocale>} Current persisted locale or default.
 */
export async function getLocaleCookie(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(LOCALE_COOKIE_NAME);
  if (cookie && isValidLocale(cookie.value)) {
    return cookie.value;
  }
  return DEFAULT_LOCALE;
}
