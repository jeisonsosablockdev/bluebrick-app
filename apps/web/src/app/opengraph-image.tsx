/**
 * @file apps/web/src/app/opengraph-image.tsx
 * @description Layer 1: Presentation - Next.js App Router Dynamic OpenGraph Image Generator.
 * Generates the 1200x630 social share preview card with dark luxury branding tokens.
 */

import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt = "BlueBrick | Plataforma de Inversión Inmobiliaria Fraccionada";

/**
 * Generates the dynamic 1200x630 OpenGraph social banner.
 */
export default function OpenGraphImage(): ImageResponse {
  // Step 1: Render branded 1200x630 social card layout with luxury backdrop
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
          background: "#0A1220",
          color: "#EDF1F5",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background radial glow accents */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(196, 18, 48, 0.25)",
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
            background: "rgba(47, 143, 107, 0.25)",
          }}
        />

        {/* Header with Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, zIndex: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              transform: "rotate(-14deg)",
            }}
          >
            <div style={{ width: 8, height: 26, borderRadius: 4, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
            <div style={{ width: 8, height: 42, borderRadius: 4, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
            <div style={{ width: 8, height: 54, borderRadius: 4, background: "linear-gradient(160deg, #F2F5F8, #8E9BAA)" }} />
            <div style={{ width: 8, height: 42, borderRadius: 4, background: "linear-gradient(160deg, #F0576B, #C41230)" }} />
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "0.08em", color: "#EDF1F5" }}>
            BLUEBRICK
          </span>
        </div>

        {/* Center Content */}
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

          <h1 style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, color: "#EDF1F5", margin: 0 }}>
            Activos Inmobiliarios Premium con Retornos Transparentes
          </h1>

          <p style={{ fontSize: 24, color: "#7C8A9C", margin: 0 }}>
            Participa en fracciones comerciales, industriales y residenciales con dividendos mensuales y respaldo institucional.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(237, 241, 245, 0.12)",
            paddingTop: 24,
            fontSize: 16,
            color: "#7C8A9C",
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
