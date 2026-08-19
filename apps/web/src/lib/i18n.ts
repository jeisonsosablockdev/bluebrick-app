export const SUPPORTED_LOCALES = ["en", "es", "pt"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "es";
export const LOCALE_COOKIE_NAME = "brids_locale";

const SUPPORTED_LOCALE_SET = new Set<string>(SUPPORTED_LOCALES);

export type LocaleText = Record<AppLocale, string>;

type ResolveRequestedLocaleInput = {
  cookieValue?: string | null;
  acceptLanguage?: string | null;
};

export function normalizeLocale(value: string | null | undefined): AppLocale | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed.length === 0) {
    return null;
  }

  if (SUPPORTED_LOCALE_SET.has(trimmed)) {
    return trimmed as AppLocale;
  }

  const baseLocale = trimmed.split(/[-_]/)[0];

  if (!baseLocale || !SUPPORTED_LOCALE_SET.has(baseLocale)) {
    return null;
  }

  return baseLocale as AppLocale;
}

export function resolveLocaleFromAcceptLanguage(acceptLanguage: string | null | undefined): AppLocale | null {
  if (!acceptLanguage) {
    return null;
  }

  const localeCandidates = acceptLanguage.split(",");

  for (const candidate of localeCandidates) {
    const tag = candidate.split(";")[0]?.trim();
    const locale = normalizeLocale(tag);

    if (locale) {
      return locale;
    }
  }

  return null;
}

export function resolveRequestedLocale({ cookieValue, acceptLanguage }: ResolveRequestedLocaleInput): AppLocale {
  return normalizeLocale(cookieValue) ?? resolveLocaleFromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}

export function localize(locale: AppLocale, text: LocaleText): string {
  return text[locale];
}
