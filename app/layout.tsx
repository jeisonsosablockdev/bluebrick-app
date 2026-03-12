import type { Metadata } from "next";

import { AppProviders } from "@/app/providers";
import { getServerLocale } from "@/lib/i18n-server";

import "./globals.css";

export const metadata: Metadata = {
  title: "BRIDS UI Demo",
  description: "UI-only App Router demo inspired by the provided design"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale}>
      <body>
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
