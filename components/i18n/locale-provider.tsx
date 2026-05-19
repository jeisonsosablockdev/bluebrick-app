"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, localize, normalizeLocale, type AppLocale, type LocaleText } from "@/lib/i18n";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
  t: (text: LocaleText) => string;
};

type LocaleProviderProps = {
  initialLocale?: AppLocale;
  children: ReactNode;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readCookieLocale(): AppLocale | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieEntry = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE_NAME}=`));

  if (!cookieEntry) {
    return null;
  }

  return normalizeLocale(cookieEntry.split("=")[1] ?? null);
}

function readNavigatorLocale(): AppLocale | null {
  if (typeof navigator === "undefined") {
    return null;
  }

  const preferredLocales = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language];

  for (const candidate of preferredLocales) {
    const locale = normalizeLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return null;
}

export function LocaleProvider({ initialLocale = DEFAULT_LOCALE, children }: LocaleProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    const nextLocale = readCookieLocale() ?? readNavigatorLocale() ?? initialLocale;
    setLocaleState((current) => (current === nextLocale ? current : nextLocale));
    document.documentElement.lang = nextLocale;
  }, [initialLocale]);

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (nextLocale === locale) {
        return;
      }

      document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      setLocaleState(nextLocale);
      document.documentElement.lang = nextLocale;
      router.refresh();
    },
    [locale, router]
  );

  const contextValue = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (text) => localize(locale, text)
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useI18n must be used within LocaleProvider.");
  }

  return context;
}
