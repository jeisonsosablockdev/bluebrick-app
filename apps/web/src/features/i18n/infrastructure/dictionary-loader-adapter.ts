/**
 * @file apps/web/src/features/i18n/infrastructure/dictionary-loader-adapter.ts
 * @description Layer 4: Infrastructure - In-Memory Dictionary Loader Adapter.
 * Provides instant access to compiled locale dictionaries.
 */

import { DEFAULT_LOCALE, type SupportedLocale, type Dictionary } from "../domain/models/locale-types";
import { es } from "../domain/dictionaries/es";
import { en } from "../domain/dictionaries/en";
import { pt } from "../domain/dictionaries/pt";
import { isValidLocale } from "./cookie-locale-adapter";
import type { DictionaryLoaderPort } from "../domain/ports/i18n-port";

const DICTIONARY_REGISTRY: Record<SupportedLocale, Dictionary> = {
  es,
  en,
  pt,
};

/**
 * Functional adapter implementing DictionaryLoaderPort.
 */
export const dictionaryLoaderAdapter: DictionaryLoaderPort = {
  loadDictionary(locale: SupportedLocale): Dictionary {
    // Step 1: Return exact match or default fallback
    return DICTIONARY_REGISTRY[locale] ?? DICTIONARY_REGISTRY[DEFAULT_LOCALE];
  },

  hasLocale(locale: string): locale is SupportedLocale {
    return isValidLocale(locale);
  },
};
