/**
 * @file apps/web/src/app/icon.tsx
 * @description Layer 1: Presentation - Next.js App Router Dynamic Favicon Generator.
 * Dynamically renders the 32x32 SVG/PNG browser favicon using the official BlueBrick 4-bar emblem
 * aligned with canonical brand tokens (#04283C, #FFFFFF, #FC040C).
 */

import { ImageResponse } from "next/og";
import { BRAND_COLORS, BRAND_GEOMETRY } from "@/features/shared";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

/**
 * Generates the dynamic 32x32 favicon icon response using official brand color tokens.
 * 
 * @returns ImageResponse containing the rendered favicon
 */
export default function Icon(): ImageResponse {
  // Step 1: Render stylized 4-bar BlueBrick emblem inside 32x32 Deep Navy canvas with canonical -24deg rotation
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
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            transform: `rotate(${BRAND_GEOMETRY.angleDeg}deg)`,
          }}
        >
          {/* Step 2: Render 3 structural bars in Pure White (#FFFFFF) */}
          <div style={{ width: 3, height: 10, borderRadius: 1.5, background: BRAND_COLORS.pureWhite }} />
          <div style={{ width: 3, height: 16, borderRadius: 1.5, background: BRAND_COLORS.pureWhite }} />
          <div style={{ width: 3, height: 20, borderRadius: 1.5, background: BRAND_COLORS.pureWhite }} />
          {/* Step 3: Render accent bar in Crimson Red (#FC040C) */}
          <div style={{ width: 3, height: 16, borderRadius: 1.5, background: BRAND_COLORS.crimsonRed }} />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
