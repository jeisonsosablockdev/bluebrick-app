/**
 * @file apps/web/src/app/apple-icon.tsx
 * @description Layer 1: Presentation - Next.js App Router Apple Touch Icon Generator.
 * Dynamically renders the 180x180 high-res Apple Touch Icon for iOS homescreen and Safari bookmarks.
 */

import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

/**
 * Generates the dynamic 180x180 Apple Touch Icon response.
 */
export default function AppleIcon(): ImageResponse {
  // Step 1: Render high-resolution BlueBrick brand emblem with dark luxury gradient tile
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #111B2E 0%, #0A1220 100%)",
          borderRadius: 36,
          border: "2px solid rgba(237, 241, 245, 0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            transform: "rotate(-14deg)",
          }}
        >
          <div style={{ width: 14, height: 50, borderRadius: 7, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
          <div style={{ width: 14, height: 80, borderRadius: 7, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
          <div style={{ width: 14, height: 100, borderRadius: 7, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
          <div style={{ width: 14, height: 80, borderRadius: 7, background: "linear-gradient(160deg, #F0576B, #C41230)" }} />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
