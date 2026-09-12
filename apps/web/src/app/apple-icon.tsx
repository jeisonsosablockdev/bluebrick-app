/**
 * @file apps/web/src/app/apple-icon.tsx
 * @description Layer 1: Presentation - Next.js App Router Apple Touch Icon Generator.
 * Dynamically renders the 180x180 high-res Apple Touch Icon for iOS homescreen and Safari bookmarks
 * aligned with canonical brand tokens (#04283C, #FFFFFF, #FC040C).
 */

import { ImageResponse } from "next/og";
import { BRAND_COLORS, BRAND_LOGO_PATHS } from "@/features/shared";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

/**
 * Generates the dynamic 180x180 Apple Touch Icon response using official brand tokens.
 * 
 * @returns ImageResponse containing the rendered Apple touch icon
 */
export default function AppleIcon(): ImageResponse {
  // Step 1: Render high-resolution BlueBrick brand emblem with Deep Navy (#04283C) luxury tile
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLORS.deepNavy,
          borderRadius: 36,
          border: "2px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* Step 2: Render canonical vector mark with 3 structural ribbons and crimson red accent */}
        <svg
          viewBox={BRAND_LOGO_PATHS.mark.viewBox}
          width={114}
          height={120}
          style={{ display: "flex" }}
        >
          <path
            d={BRAND_LOGO_PATHS.mark.whitePath}
            fill={BRAND_COLORS.pureWhite}
            fillRule="evenodd"
          />
          <path
            d={BRAND_LOGO_PATHS.mark.redPath}
            fill={BRAND_COLORS.crimsonRed}
            fillRule="evenodd"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
