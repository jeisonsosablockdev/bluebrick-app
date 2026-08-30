/**
 * @file apps/web/src/features/i18n/presentation/components/i18n-provider.tsx
 * @description Layer 1: Presentation - React Context Provider for Internationalization (i18n).
 * Supplies active locale, dictionary, translation functions, and formatters to the component tree.
 */

"use client";

import React, { createContext, useState, useCallback, useMemo, useEffect } from "react";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
  type Dictionary,
  type FormatOptions,
} from "../../domain/models/locale-types";
import { dictionaryLoaderAdapter } from "../../infrastructure/dictionary-loader-adapter";
import { cookieLocaleAdapter } from "../../infrastructure/cookie-locale-adapter";
import { browserLocaleDetector } from "../../infrastructure/browser-locale-detector";
import {
  formatCurrency as domainFormatCurrency,
  formatPercent as domainFormatPercent,
  formatNumber as domainFormatNumber,
  resolveNestedToken,
  interpolate,
} from "../../domain/formatters/locale-formatters";

export interface I18nContextValue {
  locale: SupportedLocale;
  dictionary: Dictionary;
  setLocale: (locale: SupportedLocale) => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, options?: FormatOptions) => string;
  formatPercent: (value: number, options?: FormatOptions) => string;
  formatNumber: (value: number, options?: FormatOptions) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps): React.JSX.Element {
  // Step 1: Initialize locale with deterministic value to guarantee matching SSR and Client initial render
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale || DEFAULT_LOCALE);

  // Step 2: Synchronize stored cookie or browser preferred language only after initial mount
  useEffect(() => {
    if (initialLocale) return;
    const saved = cookieLocaleAdapter.getLocale();
    if (saved) {
      if (saved !== locale) {
        setLocaleState(saved);
      }
      return;
    }
    const detected = browserLocaleDetector.detectLocale();
    if (detected && detected !== locale) {
      setLocaleState(detected);
    }
  }, [initialLocale, locale]);

  // Step 3: Handle switching locale and syncing across cookies & storage
  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    cookieLocaleAdapter.setLocale(newLocale);
  }, []);

  // Step 4: Load active dictionary
  const dictionary = useMemo(() => {
    return dictionaryLoaderAdapter.loadDictionary(locale);
  }, [locale]);

  // Step 5: Helper translation function
  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>): string => {
      const token = resolveNestedToken(dictionary, keyPath);
      if (!token) {
        // Fallback to Spanish dictionary if key is missing in active language
        const fallbackDict = dictionaryLoaderAdapter.loadDictionary(DEFAULT_LOCALE);
        const fallbackToken = resolveNestedToken(fallbackDict, keyPath);
        return fallbackToken ? interpolate(fallbackToken, params) : keyPath;
      }
      return interpolate(token, params);
    },
    [dictionary]
  );

  // Step 6: Memoized formatters bound to active locale
  const formatCurrency = useCallback(
    (amount: number, options?: FormatOptions) => {
      return domainFormatCurrency(amount, { locale, ...options });
    },
    [locale]
  );

  const formatPercent = useCallback(
    (value: number, options?: FormatOptions) => {
      return domainFormatPercent(value, { locale, ...options });
    },
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, options?: FormatOptions) => {
      return domainFormatNumber(value, { locale, ...options });
    },
    [locale]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      dictionary,
      setLocale,
      t,
      formatCurrency,
      formatPercent,
      formatNumber,
    }),
    [locale, dictionary, setLocale, t, formatCurrency, formatPercent, formatNumber]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}
