/**
 * @file apps/web/src/app/icon.tsx
 * @description Layer 1: Presentation - Next.js App Router Dynamic Favicon Generator.
 * Dynamically renders the 32x32 SVG/PNG browser favicon using the official BlueBrick 4-bar emblem.
 */

import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

/**
 * Generates the dynamic 32x32 favicon icon response.
 */
export default function Icon(): ImageResponse {
  // Step 1: Render stylized 4-bar BlueBrick isometric emblem inside 32x32 canvas
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1220",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 2,
            transform: "rotate(-14deg)",
          }}
        >
          <div style={{ width: 3, height: 10, borderRadius: 1.5, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
          <div style={{ width: 3, height: 16, borderRadius: 1.5, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
          <div style={{ width: 3, height: 20, borderRadius: 1.5, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
          <div style={{ width: 3, height: 16, borderRadius: 1.5, background: "linear-gradient(160deg, #F0576B, #C41230)" }} />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
