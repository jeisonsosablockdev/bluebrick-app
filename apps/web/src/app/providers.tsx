"use client";

import { LocaleProvider } from "@/components/i18n/locale-provider";
import { MotionProvider } from "@/components/motion/motion-provider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <MotionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </MotionProvider>
  );
}
