/**
 * @file apps/web/src/app/page.tsx
 * @description Layer 1: Presentation - BlueBrick Investor Platform Entrypoint with Multi-Language Support.
 * Renders the luxury dark landing hero, locale switcher, and the 1-click investor mock login card.
 */

"use client";

import React from "react";
import { LandingHero } from "@/components/landing/landing-hero";
import { InvestorLoginCard } from "@/components/landing/investor-login-card";
import { LocaleSwitcher, useI18n } from "@/features/i18n";

export default function HomePage(): React.JSX.Element {
  // Step 1: Access localized translation strings
  const { t } = useI18n();

  // Step 2: Render the landing page with luxury dark radial backdrop styling and top utility bar
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 24px 48px",
        background:
          "radial-gradient(1200px 600px at 15% -10%, rgba(196, 18, 48, 0.12), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(47, 143, 107, 0.12), transparent), #0A1220",
        fontFamily: "'Inter', sans-serif",
        color: "#EDF1F5",
      }}
    >
      {/* Step 3: Top Navigation Bar with LocaleSwitcher */}
      <nav
        style={{
          width: "100%",
          maxWidth: 960,
          display: "flex",
          justifyContent: "flex-end",
          paddingBottom: 16,
        }}
      >
        <LocaleSwitcher />
      </nav>

      {/* Step 4: Top Hero Branding Section */}
      <main
        style={{
          width: "100%",
          maxWidth: 720,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          margin: "auto 0",
          gap: 36,
        }}
      >
        <LandingHero />

        {/* Step 5: Interactive Investor Mock Login Access Card */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <InvestorLoginCard
            investorName="Sofía Martínez"
            initials="SM"
          />
        </div>
      </main>

      {/* Step 6: Governance & Compliance Footer */}
      <footer style={{ marginTop: 48, textAlign: "center", fontSize: 12, color: "#7C8A9C" }}>
        <p>{t("landing.footerText")}</p>
      </footer>
    </div>
  );
}
