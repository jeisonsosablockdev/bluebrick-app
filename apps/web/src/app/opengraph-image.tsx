/**
 * @file apps/web/src/app/opengraph-image.tsx
 * @description Layer 1: Presentation - Next.js App Router Dynamic OpenGraph Image Generator.
 * Generates the 1200x630 social share preview card aligned with canonical brand tokens (#04283C, #FFFFFF, #FC040C).
 */

import { ImageResponse } from "next/og";
import { BRAND_COLORS, BRAND_GEOMETRY } from "@/features/shared";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = "BlueBrick | Plataforma de Inversión Inmobiliaria Fraccionada";

/**
 * Generates the dynamic 1200x630 OpenGraph social banner aligned with official brand identity tokens.
 * 
 * @returns ImageResponse containing the rendered social preview card
 */
export default function OpenGraphImage(): ImageResponse {
  // Step 1: Render branded 1200x630 social card layout with Deep Navy (#04283C) backdrop
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          background: BRAND_COLORS.deepNavy,
          color: BRAND_COLORS.pureWhite,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Step 2: Background radial glow accents with Crimson Red (#FC040C) ambient aura */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(252, 4, 12, 0.20)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(47, 143, 107, 0.20)",
          }}
        />

        {/* Step 3: Header with canonical angled 4-bar logo emblem (-24deg) and brand typography */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              transform: `rotate(${BRAND_GEOMETRY.angleDeg}deg)`,
            }}
          >
            <div style={{ width: 8, height: 26, borderRadius: 4, background: BRAND_COLORS.pureWhite }} />
            <div style={{ width: 8, height: 42, borderRadius: 4, background: BRAND_COLORS.pureWhite }} />
            <div style={{ width: 8, height: 54, borderRadius: 4, background: BRAND_COLORS.pureWhite }} />
            <div style={{ width: 8, height: 42, borderRadius: 4, background: BRAND_COLORS.crimsonRed }} />
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.08em", color: BRAND_COLORS.pureWhite }}>
            BLUEBRICK
          </span>
        </div>

        {/* Step 4: Center headline & institutional value proposition */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 10, maxWidth: 900 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 999,
              border: "1px solid rgba(47, 143, 107, 0.4)",
              background: "rgba(47, 143, 107, 0.15)",
              padding: "8px 20px",
              fontSize: 16,
              fontWeight: 600,
              color: "#57B98C",
              alignSelf: "flex-start",
            }}
          >
            <span>Inversión Inmobiliaria Fraccionada</span>
          </div>

          <h1 style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, color: BRAND_COLORS.pureWhite, margin: 0 }}>
            Activos Inmobiliarios Premium con Retornos Transparentes
          </h1>

          <p style={{ fontSize: 24, color: "#94A3B8", margin: 0 }}>
            Participa en fracciones comerciales, industriales y residenciales con dividendos mensuales y respaldo institucional.
          </p>
        </div>

        {/* Step 5: Footer brand watermark and regulatory trust indicator */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            paddingTop: 24,
            fontSize: 16,
            color: "#94A3B8",
            zIndex: 10,
          }}
        >
          <span>bluebrick-app.vercel.app</span>
          <span>Institucional · Transparente · Regulado</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
