/**
 * @file apps/web/src/components/landing/landing-hero.tsx
 * @description Layer 1: Presentation - Landing Page Hero Header Component with Multi-Language Localization.
 * Features luxury dark branding, value proposition badge, and dynamic i18n headline typography.
 */

"use client";

import React from "react";
import { BlueBrickMark } from "@/components/dashboard/blue-brick-mark";
import { Sparkles, ShieldCheck } from "lucide-react";
import { useI18n } from "@/features/i18n";

/**
 * LandingHero presents the BlueBrick investor portal headline and luxury theme tokens.
 */
export function LandingHero(): React.JSX.Element {
  // Step 1: Access localized translation strings
  const { t } = useI18n();

  // Step 2: Render top brand header with logo emblem and translated copy
  return (
    <header style={{ display: "flex", width: "100%", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      {/* Brand Emblem & Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <BlueBrickMark />
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#EDF1F5",
          }}
        >
          {t("common.brandName")}
        </span>
      </div>

      {/* Trust & Category Tag */}
      <div
        style={{
          marginTop: 24,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          border: "1px solid rgba(47,143,107,0.35)",
          background: "rgba(47,143,107,0.12)",
          padding: "6px 16px",
          fontSize: 12,
          fontWeight: 600,
          color: "#57B98C",
        }}
      >
        <Sparkles size={14} />
        {t("landing.badge")}
      </div>

      {/* Primary Headline */}
      <h1
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(28px, 4vw, 42px)",
          lineHeight: 1.15,
          fontWeight: 700,
          color: "#EDF1F5",
          maxWidth: 640,
          margin: "20px 0 0 0",
        }}
      >
        {t("landing.headline")}
      </h1>

      {/* Subtitle description */}
      <p
        style={{
          marginTop: 14,
          maxWidth: 540,
          fontSize: 14,
          lineHeight: 1.6,
          color: "#7C8A9C",
          margin: "14px 0 0 0",
        }}
      >
        {t("landing.subtitle")}
      </p>

      {/* Security indicator */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#7C8A9C" }}>
        <ShieldCheck size={14} color="#57B98C" />
        <span>{t("landing.securityBadge")}</span>
      </div>
    </header>
  );
}
