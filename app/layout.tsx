import type { Metadata } from "next";

import { AppProviders } from "@/app/providers";
import { getServerLocale } from "@/lib/i18n-server";
import { createRootMetadata } from "@/lib/seo";
import { DEFAULT_THEME_MODE, THEME_STORAGE_KEY } from "@/lib/theme";

import "./globals.css";

export const metadata: Metadata = createRootMetadata({
  title: "BRIDS",
  description: "AI discovery infrastructure and public platform pages for BRIDS."
});

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();
  const themeInitScript = `
    (function () {
      try {
        var storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
        var nextTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "${DEFAULT_THEME_MODE}";
        document.documentElement.setAttribute("data-theme", nextTheme);
      } catch (_error) {
        document.documentElement.setAttribute("data-theme", "${DEFAULT_THEME_MODE}");
      }
    })();
  `;

  return (
    <html lang={locale}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
}
