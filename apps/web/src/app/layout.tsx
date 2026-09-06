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

/**
 * Viewport configuration defining responsive device behavior and theme color.
 */
export const viewport: Viewport = {
  themeColor: "#0A1220",
  width: "device-width",
  initialScale: 1,
};

/**
 * Root metadata configuration for Next.js App Router.
 * Configures OpenGraph, Twitter cards, SEO titles, descriptions, and icons.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://portal.bluebrick.capital")
  ),
  title: {
    default: "BlueBrick | Capital Inteligente · Activos Reales",
    template: "%s | BlueBrick Platform",
  },
  description:
    "Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio.",
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
    title: "BlueBrick | Capital Inteligente · Activos Reales",
    description:
      "Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "BlueBrick | Capital Inteligente · Activos Reales",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlueBrick | Capital Inteligente · Activos Reales",
    description:
      "Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio.",
    images: ["/opengraph-image"],
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

/**
 * Presentation Layer Root Layout for Next.js App Router.
 * Configures font providers, HTML head structured data, WorkOS AuthKit, and global application providers.
 *
 * @param props.children React sub-tree to render within the root layout.
 * @returns Root HTML shell with applied theme and providers.
 */
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
