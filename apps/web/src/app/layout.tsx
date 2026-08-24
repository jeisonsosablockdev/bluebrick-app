/**
 * @file apps/web/src/app/layout.tsx
 * @description Layer 1: Presentation - Root Layout for Next.js App Router.
 * Configures base metadata, HTML shell, and global context providers.
 */

import type { Metadata } from "next";
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlueBrick | Plataforma de Inversión Inmobiliaria Fraccionada",
  description: "Invierte en fracciones inmobiliarias comerciales, residenciales e industriales con retornos garantizados.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Step 1: Wrap app contents in HTML shell with AuthKitProvider and global UI providers
  return (
    <html lang="es" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-blue-500 selection:text-white">
        <AuthKitProvider>
          <Providers>{children}</Providers>
        </AuthKitProvider>
      </body>
    </html>
  );
}
