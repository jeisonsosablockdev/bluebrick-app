import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "BRIDS UI Demo",
  description: "UI-only App Router demo inspired by the provided design"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
