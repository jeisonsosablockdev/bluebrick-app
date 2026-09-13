/**
 * @file apps/web/src/app/icon.tsx
 * @description Layer 1: Presentation - Next.js App Router Dynamic Favicon Generator.
 * Dynamically renders the 32x32 SVG/PNG browser favicon using the official BlueBrick 4-bar emblem
 * aligned with canonical brand tokens (#04283C, #FFFFFF, #FC040C).
 */

import { ImageResponse } from "next/og";
import { BRAND_COLORS, BRAND_LOGO_PATHS } from "@/features/shared";

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
  // Step 1: Render official BlueBrick brand mark inside 32x32 Deep Navy canvas
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
        {/* Step 2: Render official vector mark */}
        <svg
          viewBox={BRAND_LOGO_PATHS.mark.viewBox}
          width={22}
          height={23}
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
