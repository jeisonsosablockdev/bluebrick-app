/**
 * @file apps/web/src/features/i18n/application/queries/get-dictionary-query.ts
 * @description Layer 2: Application - Server-Side Dictionary Query for RSC & Edge Routes.
 */

import { type SupportedLocale, type Dictionary } from "../../domain/models/locale-types";
import { dictionaryLoaderAdapter } from "../../infrastructure/dictionary-loader-adapter";
import { getLocaleCookie } from "../actions/locale-cookie-actions";

/**
 * Resolves the active dictionary for the current server request context.
 *
 * @param explicitLocale - Optional override locale if known.
 * @returns {Promise<{ locale: SupportedLocale; dictionary: Dictionary }>} Active locale and dictionary.
 */
export async function getDictionaryQuery(explicitLocale?: SupportedLocale): Promise<{
  locale: SupportedLocale;
  dictionary: Dictionary;
}> {
  // Step 1: Resolve active locale from argument or cookie
  const locale = explicitLocale || (await getLocaleCookie());

  // Step 2: Load compiled dictionary
  const dictionary = dictionaryLoaderAdapter.loadDictionary(locale);

  return {
    locale,
    dictionary,
  };
}
