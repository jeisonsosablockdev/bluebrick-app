/**
 * @file apps/web/src/app/page.tsx
 * @description Layer 1: Presentation - BlueBrick Investor Platform Entrypoint with Multi-Language and Light/Dark Theme Support.
 * Renders the luxury landing hero, theme toggle, locale switcher, and the institutional investor login card.
 */

"use client";

import React from "react";
import { LandingHero } from "@/components/landing/landing-hero";
import { InvestorLoginCard } from "@/components/landing/investor-login-card";
import { LocaleSwitcher, useI18n } from "@/features/i18n";
import { ThemeToggle, useTheme } from "@/components/theme";

export default function HomePage(): React.JSX.Element {
  // Step 1: Access localized translation strings and active theme
  const { t } = useI18n();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  // Step 2: Render the landing page with theme-adaptive radial backdrop styling and top utility bar
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 24px 48px",
        background: isDark
          ? "radial-gradient(1200px 600px at 15% -10%, rgba(196, 18, 48, 0.12), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(47, 143, 107, 0.12), transparent), #0A1220"
          : "radial-gradient(1200px 600px at 15% -10%, rgba(196, 18, 48, 0.05), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(47, 143, 107, 0.05), transparent), #F8FAFC",
        fontFamily: "'Inter', sans-serif",
        color: isDark ? "#EDF1F5" : "#0A1220",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Step 3: Top Navigation Bar with ThemeToggle & LocaleSwitcher */}
      <nav
        style={{
          width: "100%",
          maxWidth: 960,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          paddingBottom: 16,
        }}
      >
        <ThemeToggle />
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

        {/* Step 5: Interactive Investor Real Auth Login Card */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <InvestorLoginCard />
        </div>
      </main>

      {/* Step 6: Governance & Compliance Footer */}
      <footer
        style={{
          marginTop: 48,
          textAlign: "center",
          fontSize: 12,
          color: isDark ? "#7C8A9C" : "#718096",
        }}
      >
        <p>{t("landing.footerText")}</p>
      </footer>
    </div>
  );
}
