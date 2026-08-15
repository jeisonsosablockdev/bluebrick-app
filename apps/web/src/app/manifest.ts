import type { MetadataRoute } from "next";

import {
  PWA_APP_NAME,
  PWA_BACKGROUND_COLOR,
  PWA_DESCRIPTION,
  PWA_ICON_PATHS,
  PWA_MANIFEST_ID,
  PWA_SCOPE,
  PWA_SHORT_NAME,
  PWA_START_URL,
  PWA_THEME_COLOR
} from "@/lib/pwa/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: PWA_MANIFEST_ID,
    name: PWA_APP_NAME,
    short_name: PWA_SHORT_NAME,
    description: PWA_DESCRIPTION,
    start_url: PWA_START_URL,
    scope: PWA_SCOPE,
    display: "standalone",
    orientation: "portrait",
    background_color: PWA_BACKGROUND_COLOR,
    theme_color: PWA_THEME_COLOR,
    icons: [
      {
        src: PWA_ICON_PATHS.app192,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: PWA_ICON_PATHS.app512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
