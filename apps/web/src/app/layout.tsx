/**
 * @file apps/web/src/app/layout.tsx
 * @description Layer 1: Presentation - Root Layout for Next.js App Router.
 * Configures base SEO metadata, Schema.org JSON-LD, HTML shell, and global context providers.
 */

import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { Providers } from "./providers";
import { StructuredData } from "@/components/seo/structured-data";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A1220",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://bluebrick-app.vercel.app"),
  title: {
    default: "BlueBrick | Plataforma de Inversión Inmobiliaria Fraccionada",
    template: "%s | BlueBrick Platform",
  },
  description:
    "Invierte en fracciones de proyectos inmobiliarios premium (comerciales, residenciales e industriales) con retornos transparentes y dividendos mensuales.",
  keywords: [
    "inversión inmobiliaria",
    "real estate fraccionado",
    "retornos mensuales",
    "propiedades comerciales",
    "proptech colombia",
    "tokenización inmobiliaria",
    "bluebrick",
  ],
  authors: [{ name: "BlueBrick Global" }],
  creator: "BlueBrick Dev Team",
  icons: {
    icon: [
      { url: "/brand/bluebrick-mark-dark.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "/",
    siteName: "BlueBrick",
    title: "BlueBrick | Inversión Inmobiliaria Fraccionada",
    description:
      "Plataforma privada de inversión en fracciones inmobiliarias comerciales, industriales y residenciales con alta rentabilidad.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlueBrick | Inversión Inmobiliaria Fraccionada",
    description: "Invierte en activos inmobiliarios premium con rendimientos mensuales transparentes.",
    creator: "@bluebrick_app",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Step 1: Wrap app contents in HTML shell with font variables, StructuredData, AuthKitProvider and global UI providers
  return (
    <html
      lang="es"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <StructuredData />
      </head>
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-[#C41230] selection:text-[#EDF1F5] font-sans">
        <AuthKitProvider>
          <Providers>{children}</Providers>
        </AuthKitProvider>
      </body>
    </html>
  );
}
