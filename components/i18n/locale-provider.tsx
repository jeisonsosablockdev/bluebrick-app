"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { LOCALE_COOKIE_NAME, localize, type AppLocale, type LocaleText } from "@/lib/i18n";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
  t: (text: LocaleText) => string;
};

type LocaleProviderProps = {
  initialLocale: AppLocale;
  children: ReactNode;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  const setLocale = useCallback(
    (nextLocale: AppLocale) => {
      if (nextLocale === locale) {
        return;
      }

      document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
      setLocaleState(nextLocale);
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
