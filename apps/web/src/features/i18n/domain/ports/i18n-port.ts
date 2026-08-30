/**
 * @file apps/web/src/features/i18n/domain/ports/i18n-port.ts
 * @description Layer 3: Domain - Port Interface Contracts for i18n Subsystem.
 * Enforces abstract contracts for dictionary providers, locale detectors, and persistence adapters.
 */

import type { SupportedLocale, Dictionary, FormatOptions } from "../models/locale-types";

/**
 * Port contract for retrieving translation dictionaries.
 */
export interface DictionaryLoaderPort {
  loadDictionary(locale: SupportedLocale): Dictionary;
  hasLocale(locale: string): locale is SupportedLocale;
}

/**
 * Port contract for detecting client and server locale preferences.
 */
export interface LocaleDetectorPort {
  detectLocale(): SupportedLocale;
}

/**
 * Port contract for persisting and retrieving user locale preferences via cookies/storage.
 */
export interface LocaleStoragePort {
  getLocale(): SupportedLocale | null;
  setLocale(locale: SupportedLocale): void;
}

/**
 * Port contract for locale-sensitive string formatting.
 */
export interface LocaleFormatterPort {
  formatCurrency(amount: number, options?: FormatOptions): string;
  formatPercent(value: number, options?: FormatOptions): string;
  formatNumber(value: number, options?: FormatOptions): string;
  formatDate(date: Date | string | number, locale?: SupportedLocale): string;
  interpolate(template: string, params?: Record<string, string | number>): string;
}
