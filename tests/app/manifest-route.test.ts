import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";
import { PWA_BACKGROUND_COLOR, PWA_ICON_PATHS, PWA_THEME_COLOR } from "@/lib/pwa/config";

describe("app/manifest", () => {
  it("declares a standalone manifest with stable icon endpoints", () => {
    const value = manifest();

    expect(value.id).toBe("/");
    expect(value.display).toBe("standalone");
    expect(value.start_url).toBe("/?source=pwa");
    expect(value.background_color).toBe(PWA_BACKGROUND_COLOR);
    expect(value.theme_color).toBe(PWA_THEME_COLOR);
    expect(value.icons).toEqual([
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
    ]);
  });
});
