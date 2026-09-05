/**
 * @file apps/web/src/features/i18n/application/hooks/use-i18n.ts
 * @description Layer 2: Application - Custom React Hook for Consuming i18n Context.
 * Provides typed translation tokens `t()`, current locale, locale switch action, and formatters.
 */

"use client";

import { useContext } from "react";
import { I18nContext, type I18nContextValue } from "../../presentation/components/i18n-provider";
import { DEFAULT_LOCALE } from "../../domain/models/locale-types";
import { dictionaryLoaderAdapter } from "../../infrastructure/dictionary-loader-adapter";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatTiming,
  formatPhaseName,
  formatPhaseDescription,
  resolveNestedToken,
  interpolate,
} from "../../domain/formatters/locale-formatters";

const fallbackDictionary = dictionaryLoaderAdapter.loadDictionary(DEFAULT_LOCALE);

/**
 * Default fallback context used when components are rendered in isolation or outside I18nProvider.
 */
const defaultFallbackContext: I18nContextValue = {
  locale: DEFAULT_LOCALE,
  dictionary: fallbackDictionary,
  setLocale: () => {},
  t: (keyPath: string, params?: Record<string, string | number>): string => {
    const token = resolveNestedToken(fallbackDictionary, keyPath);
    return token ? interpolate(token, params) : keyPath;
  },
  formatCurrency: (amount, options) => formatCurrency(amount, { locale: DEFAULT_LOCALE, ...options }),
  formatPercent: (val, options) => formatPercent(val, { locale: DEFAULT_LOCALE, ...options }),
  formatNumber: (val, options) => formatNumber(val, { locale: DEFAULT_LOCALE, ...options }),
  formatTiming: (timing, options) => formatTiming(timing, { locale: DEFAULT_LOCALE, ...options }),
  formatPhaseName: (name, options) => formatPhaseName(name, { locale: DEFAULT_LOCALE, ...options }),
  formatPhaseDescription: (desc, options) => formatPhaseDescription(desc, { locale: DEFAULT_LOCALE, ...options }),
};

/**
 * Hook to access the internationalization context.
 * Gracefully falls back to default locale (es) if accessed outside <I18nProvider />.
 *
 * @returns {I18nContextValue} The i18n context containing dictionary, locale state, and formatters.
 */
export function useI18n(): I18nContextValue {
  // Step 1: Consume active context or fallback to default Spanish provider
  const context = useContext(I18nContext);
  return context ?? defaultFallbackContext;
}
