/**
 * @file apps/web/src/components/landing/landing-hero.tsx
 * @description Layer 1: Presentation - Landing Page Hero Header Component with Multi-Language Localization.
 * Features luxury branding, institutional headline typography, and trust indicator.
 */

"use client";

import { BlueBrickLogo } from "@/components/dashboard/blue-brick-logo";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useTheme } from "@/components/theme";
import { BRAND_COLORS } from "@/features/shared";

/**
 * LandingHero presents the BlueBrick investor portal headline and luxury theme tokens.
 */
export function LandingHero(): React.JSX.Element {
  // Step 1: Access localized translation strings and active theme
  const { t } = useI18n();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  // Step 2: Render top brand header with official horizontal logo and translated copy
  return (
    <header style={{ display: "flex", width: "100%", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      {/* Brand Emblem & Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BlueBrickLogo height={38} priority />
      </div>

      {/* Primary Headline */}
      <h1
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(28px, 4vw, 42px)",
          lineHeight: 1.15,
          fontWeight: 700,
          color: isDark ? "#EDF1F5" : "#0A1220",
          maxWidth: 640,
          margin: "24px 0 0 0",
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
          color: isDark ? "#7C8A9C" : "#4A5568",
          margin: "14px 0 0 0",
        }}
      >
        {t("landing.subtitle")}
      </p>

      {/* Security and Trust indicator */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: isDark ? "#7C8A9C" : "#4A5568" }}>
        <ShieldCheck size={14} color={isDark ? "#57B98C" : "#2F8F6B"} />
        <span>{t("landing.securityBadge")}</span>
      </div>
    </header>
  );
}
