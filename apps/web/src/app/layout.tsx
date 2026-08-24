/**
 * @file apps/web/src/app/layout.tsx
 * @description Layer 1: Presentation - Root Layout for Next.js App Router.
 * Configures base metadata, HTML shell, and global context providers.
 */

import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js + Solana Starter",
  description: "High-performance Web3 starter with 4-Layer Architecture and Autonomous Governance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Step 1: Wrap app contents in HTML shell with dark theme and providers
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-blue-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
