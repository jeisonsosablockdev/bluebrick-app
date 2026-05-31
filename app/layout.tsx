import type { Metadata } from "next";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { AppProviders } from "@/app/providers";
import { ClientAnalytics } from "@/components/observability/client-analytics";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { createRootMetadata } from "@/lib/seo";
import { DEFAULT_THEME_MODE, THEME_STORAGE_KEY } from "@/lib/theme";

import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = createRootMetadata({
  title: "BRIDS",
  description: "AI discovery infrastructure and public platform pages for BRIDS."
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Suspense fallback={null}>
          <ClientAnalytics />
        </Suspense>
        <AppProviders>{children}</AppProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
