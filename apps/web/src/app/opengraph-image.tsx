/**
 * @file apps/web/src/app/opengraph-image.tsx
 * @description Layer 1: Presentation - Next.js App Router Dynamic OpenGraph Image Generator.
 * Generates the 1200x630 social share preview card aligned with canonical brand tokens (#04283C, #FFFFFF, #FC040C).
 */

import { ImageResponse } from "next/og";
import { BRAND_COLORS, BRAND_GEOMETRY } from "@/features/shared";

/**
 * Dimensions for the OpenGraph card according to standard social media metadata specifications (1200x630).
 */
export const size = {
  width: 1200,
  height: 630,
};

/**
 * Output MIME type for the generated dynamic social card image.
 */
export const contentType = "image/png";

/**
 * Accessibility alternative text for the dynamic OpenGraph social card.
 */
export const alt = "BlueBrick | Capital Inteligente · Activos Reales";

/**
 * Renders the JSX element tree for the 1200x630 social preview card.
 * Exported separately to facilitate pure behavioral and contract unit testing.
 *
 * @returns React.ReactElement containing the complete branded card
 */
export function OpenGraphCard(): React.ReactElement {
  // Step 1: Render branded 1200x630 social card layout with Deep Navy (#04283C) backdrop
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "50px 70px",
        background: BRAND_COLORS.deepNavy,
        color: BRAND_COLORS.pureWhite,
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Step 2: Background radial ambient glow accents (Crimson Red & Emerald Green) */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(252, 4, 12, 0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -120,
          right: -120,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(47, 143, 107, 0.18)",
        }}
      />

      {/* Step 3: Top Header Bar with official angled 4-bar emblem and brand title */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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
          <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.08em", color: BRAND_COLORS.pureWhite }}>
            BLUEBRICK
          </span>
        </div>

        {/* Step 4: Header Tag Pill Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderRadius: 999,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            background: "rgba(255, 255, 255, 0.08)",
            padding: "8px 22px",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#E2E8F0",
            textTransform: "uppercase",
          }}
        >
          <span>CREACIÓN DE PATRIMONIO</span>
        </div>
      </div>

      {/* Step 5: Core Value Proposition Section (Headline & Description) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 1000 }}>
        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, color: BRAND_COLORS.pureWhite, margin: 0 }}>
          Capital Inteligente. Activos Reales
        </h1>
        <p style={{ fontSize: 22, lineHeight: 1.35, color: "#94A3B8", margin: 0 }}>
          Oportunidades inmobiliarias seleccionadas para crear y hacer crecer tu patrimonio.
        </p>
      </div>

      {/* Step 6: 3 Strategic Pillars Grid */}
      <div style={{ display: "flex", gap: 20 }}>
        {/* Pillar 1: Real Estate */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "16px 20px",
            borderRadius: 14,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: BRAND_COLORS.pureWhite }}>
            Real Estate
          </span>
          <span style={{ fontSize: 14, color: "#57B98C", fontWeight: 500 }}>
            Inversión Inmobiliaria
          </span>
        </div>

        {/* Pillar 2: Gestión Profesional */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "16px 20px",
            borderRadius: 14,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: BRAND_COLORS.pureWhite }}>
            Gestión Profesional
          </span>
          <span style={{ fontSize: 14, color: "#94A3B8", fontWeight: 500 }}>
            Estrategia y Control
          </span>
        </div>

        {/* Pillar 3: Patrimonio */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "16px 20px",
            borderRadius: 14,
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700, color: BRAND_COLORS.pureWhite }}>
            Patrimonio
          </span>
          <span style={{ fontSize: 14, color: "#F87171", fontWeight: 500 }}>
            Crecimiento Sostenible
          </span>
        </div>
      </div>

      {/* Step 7: Footer Bar with Canonical Domain and Value Signoff */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          paddingTop: 18,
          fontSize: 15,
          color: "#94A3B8",
        }}
      >
        <span style={{ fontWeight: 600, color: "#CBD5E1" }}>portal.bluebrick.capital</span>
        <span>Patrimonio · Crecimiento Sostenible</span>
      </div>
    </div>
  );
}

/**
 * Generates the dynamic 1200x630 OpenGraph social banner aligned with official brand identity tokens.
 * 
 * @returns ImageResponse containing the rendered social preview card
 */
export default function OpenGraphImage(): ImageResponse {
  // Step 1: Render OpenGraphCard element with standard 1200x630 dimensions
  return new ImageResponse(OpenGraphCard(), {
    ...size,
  });
}
