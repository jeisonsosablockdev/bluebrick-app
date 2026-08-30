/**
 * @file apps/web/src/features/i18n/domain/formatters/locale-formatters.ts
 * @description Layer 3: Domain - Locale-Aware Number, Currency, Date, and String Interpolation Formatters.
 * Uses standard Intl APIs with fallback resilience.
 */

import { DEFAULT_LOCALE, type SupportedLocale, type FormatOptions } from "../models/locale-types";

/**
 * Maps supported locale codes to full BCP 47 language tags for Intl formatting.
 */
const BCP47_TAGS: Record<SupportedLocale, string> = {
  es: "es-US",
  en: "en-US",
  pt: "pt-BR",
};

/**
 * Format a numeric amount as USD currency according to locale customs.
 * Operates in US Dollars ($ USD) across all supported languages.
 *
 * @param amount - Number value in USD dollars.
 * @param options - Formatting configuration overrides.
 * @returns Formatted currency string (e.g., "$120,000" or "$120,000 USD").
 */
export function formatCurrency(amount: number, options?: FormatOptions & { showCode?: boolean }): string {
  // Step 1: Resolve target locale tag
  const locale = options?.locale || DEFAULT_LOCALE;
  const tag = BCP47_TAGS[locale] || "es-US";

  // Step 2: Format number using Intl.NumberFormat
  try {
    const formatted = new Intl.NumberFormat(tag, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }).format(amount);

    return options?.showCode ? `${formatted} USD` : formatted;
  } catch {
    // Step 3: Fallback if Intl fails in unexpected environments
    return `$${amount.toLocaleString()}`;
  }
}

/**
 * Format a numeric percentage according to locale conventions.
 *
 * @param value - Percentage value (e.g. 14.5).
 * @param options - Formatting configuration.
 * @returns Formatted percentage string (e.g. "14,5%" or "14.5%").
 */
export function formatPercent(value: number, options?: FormatOptions): string {
  const locale = options?.locale || DEFAULT_LOCALE;
  const tag = BCP47_TAGS[locale] || "es-CO";

  try {
    return new Intl.NumberFormat(tag, {
      minimumFractionDigits: options?.minimumFractionDigits ?? 1,
      maximumFractionDigits: options?.maximumFractionDigits ?? 1,
    }).format(value) + "%";
  } catch {
    return `${value.toFixed(1)}%`;
  }
}

/**
 * Format an integer or float number.
 *
 * @param value - Numerical value.
 * @param options - Formatting options.
 * @returns Formatted number string.
 */
export function formatNumber(value: number, options?: FormatOptions): string {
  const locale = options?.locale || DEFAULT_LOCALE;
  const tag = BCP47_TAGS[locale] || "es-CO";

  try {
    return new Intl.NumberFormat(tag, {
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(value);
  } catch {
    return value.toString();
  }
}

/**
 * Traverses a nested dictionary object with a dot-separated key string.
 * Example: `resolveNestedToken(dict, "dashboard.cards.investedAmount")`
 *
 * @param obj - Dictionary object tree.
 * @param path - Dot-delimited path (e.g. "landing.headline").
 * @returns Found translation string or null if path does not exist.
 */
export function resolveNestedToken(obj: unknown, path: string): string | null {
  // Step 1: Split path into key segments
  const parts = path.split(".");
  let current: unknown = obj;

  // Step 2: Traverse nested tree safely
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  return typeof current === "string" ? current : null;
}

/**
 * Interpolate template strings with dynamic parameter objects.
 * Example: `interpolate("Hello {name}, you have {count} items", { name: "Sofía", count: 5 })`
 *
 * @param template - Raw translation string containing `{variable}` placeholders.
 * @param params - Key-value replacements.
 * @returns Evaluated string with replaced tokens.
 */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
}
