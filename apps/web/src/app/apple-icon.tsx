/**
 * @file apps/web/src/app/apple-icon.tsx
 * @description Layer 1: Presentation - Next.js App Router Apple Touch Icon Generator.
 * Dynamically renders the 180x180 high-res Apple Touch Icon for iOS homescreen and Safari bookmarks
 * aligned with canonical brand tokens (#04283C, #FFFFFF, #FC040C).
 */

import { ImageResponse } from "next/og";
import { BRAND_COLORS, BRAND_GEOMETRY } from "@/features/shared";

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
        {/* Step 2: Angled container with canonical -24deg rotation */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            transform: `rotate(${BRAND_GEOMETRY.angleDeg}deg)`,
          }}
        >
          {/* Step 3: Structural bars in Pure White (#FFFFFF) and accent bar in Crimson Red (#FC040C) */}
          <div style={{ width: 14, height: 50, borderRadius: 7, background: BRAND_COLORS.pureWhite }} />
          <div style={{ width: 14, height: 80, borderRadius: 7, background: BRAND_COLORS.pureWhite }} />
          <div style={{ width: 14, height: 100, borderRadius: 7, background: BRAND_COLORS.pureWhite }} />
          <div style={{ width: 14, height: 80, borderRadius: 7, background: BRAND_COLORS.crimsonRed }} />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
