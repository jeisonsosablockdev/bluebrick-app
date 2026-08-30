/**
 * @file apps/web/src/app/manifest.ts
 * @description Layer 1: Presentation - Next.js App Router Dynamic Web App Manifest Generator.
 * Configures PWA metadata, theme tokens, display preferences, and icons for mobile install.
 */

import type { MetadataRoute } from "next";

/**
 * Generates the web app manifest for BlueBrick platform.
 */
export default function manifest(): MetadataRoute.Manifest {
  // Step 1: Return structured Web App Manifest configuration
  return {
    name: "BlueBrick - Inversión Inmobiliaria Fraccionada",
    short_name: "BlueBrick",
    description:
      "Plataforma institucional de inversión inmobiliaria fraccionada con retornos transparentes y dividendos mensuales.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A1220",
    theme_color: "#0A1220",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
