"use client";

import { LocaleProvider } from "@/components/i18n/locale-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LocaleProvider>{children}</LocaleProvider>
  );
}
