/**
 * @file apps/web/src/components/landing/investor-login-card.tsx
 * @description Layer 1: Presentation - Institutional Investor Login Card with WorkOS Multi-Provider Support & Theme Adaptivity.
 * Presents dedicated secure authentication entrypoint for verified investors, supporting WorkOS email sign-in, multi-provider compatibility, and light/dark theme modes.
 */

"use client";

import React from "react";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useTheme } from "@/components/theme";

export interface InvestorLoginCardProps {
  className?: string;
}

/**
 * Provider icon definitions for visual compatibility display.
 */
function GoogleIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function AppleIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 170 170" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.7-7.98-12.04-14.7-5.99-9.13-10.74-19.8-14.26-32.02-3.52-12.22-5.27-23.79-5.27-34.7 0-14.88 3.82-27.17 11.45-36.87 7.63-9.7 17.1-14.65 28.41-14.86 4.35 0 9.4 1.15 15.15 3.44 5.75 2.29 9.38 3.47 10.88 3.55 1.05 0 4.96-1.34 11.75-4.02 6.78-2.68 12.43-3.8 16.94-3.37 12.83.65 23.01 5.3 30.55 13.96-10.74 6.54-16 15.74-15.77 27.6.24 9.39 3.84 17.24 10.8 23.54 6.96 6.3 15.22 10.02 24.78 11.16-2.07 6.32-4.66 12.59-7.78 18.82zM119.22 33.02c0-7.39 2.65-14.28 7.96-20.67 5.3-6.39 11.83-10.51 19.58-12.35 1.05 7.6-1.57 14.62-7.85 21.05-6.28 6.43-12.85 10.08-19.69 11.97z" />
    </svg>
  );
}

function YahooIcon(): React.JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.5 4h3.5l4.8 9.5L15.6 4h3.5l-6.8 12.8v5.2H8.8v-5.2L2.5 4z"
        fill="#7B0099"
      />
      <circle cx="20.5" cy="18" r="1.8" fill="#7B0099" />
    </svg>
  );
}

/**
 * InvestorLoginCard displays the dedicated, institutional investor entry card.
 */
export function InvestorLoginCard({ className = "" }: InvestorLoginCardProps): React.JSX.Element {
  // Step 1: Access localized translation strings and active theme
  const { t } = useI18n();
  const { theme } = useTheme();

  const isDark = theme === "dark";

  // Step 2: Theme-adaptive color tokens matching luxury design specifications
  const cardBg = isDark
    ? "linear-gradient(160deg, #111B2E 0%, #0D1526 100%)"
    : "linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 100%)";
  const cardBorder = isDark ? "1px solid rgba(237, 241, 245, 0.1)" : "1px solid rgba(10, 18, 32, 0.1)";
  const cardShadow = isDark ? "0 20px 40px rgba(0, 0, 0, 0.45)" : "0 20px 40px rgba(10, 18, 32, 0.08)";
  const headerBorder = isDark ? "1px solid rgba(237, 241, 245, 0.08)" : "1px solid rgba(10, 18, 32, 0.08)";
  const titleColor = isDark ? "#EDF1F5" : "#0A1220";
  const subtitleColor = isDark ? "#A0AEC0" : "#4A5568";
  const chipBg = isDark ? "rgba(237, 241, 245, 0.05)" : "rgba(10, 18, 32, 0.04)";
  const chipBorder = isDark ? "1px solid rgba(237, 241, 245, 0.1)" : "1px solid rgba(10, 18, 32, 0.1)";
  const chipText = isDark ? "#EDF1F5" : "#1A202C";

  // Step 3: Render stylized login card container
  return (
    <div
      className={className}
      style={{
        background: cardBg,
        border: cardBorder,
        borderRadius: 20,
        padding: "32px",
        width: "100%",
        maxWidth: 460,
        boxShadow: cardShadow,
        transition: "all 0.3s ease",
      }}
    >
      {/* Step 4: Card Header with Investor Access & Private Portal Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: headerBorder,
          paddingBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: isDark ? "#7C8A9C" : "#718096",
          }}
        >
          <Lock size={14} color="#E8495F" />
          <span>{t("loginCard.headerTitle")}</span>
        </div>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            borderRadius: 999,
            background: isDark ? "rgba(87, 185, 140, 0.12)" : "rgba(47, 143, 107, 0.1)",
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: isDark ? "#57B98C" : "#2F8F6B",
            border: isDark ? "1px solid rgba(87, 185, 140, 0.3)" : "1px solid rgba(47, 143, 107, 0.3)",
          }}
        >
          <ShieldCheck size={12} />
          {t("loginCard.privatePortalBadge")}
        </span>
      </div>

      {/* Step 5: Exclusive Access Headline & Explanatory Subtitle */}
      <div style={{ margin: "24px 0 20px" }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: titleColor,
            lineHeight: 1.3,
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}
        >
          {t("loginCard.exclusiveAccessTitle")}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: subtitleColor,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {t("loginCard.loginSubtitle")}
        </p>
      </div>

      {/* Step 6: Primary Action - WorkOS AuthKit Universal Email Login */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <a
          href="/auth/login"
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderRadius: 12,
            padding: "14px",
            fontSize: 14,
            fontWeight: 700,
            color: "#FFFFFF",
            background: "linear-gradient(135deg, #E8495F 0%, #C41230 100%)",
            boxShadow: "0 8px 24px rgba(196, 18, 48, 0.35)",
            textDecoration: "none",
            cursor: "pointer",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          <Mail size={18} color="#FFFFFF" />
          <span>{t("loginCard.emailLoginButton")}</span>
          <ArrowRight size={16} color="#FFFFFF" />
        </a>

        {/* Step 7: Multi-Provider Compatibility Row (Google, Microsoft, Apple, Corporate SSO) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: isDark ? "#7C8A9C" : "#718096",
              textAlign: "center",
              letterSpacing: "0.02em",
            }}
          >
            {t("loginCard.supportedProvidersLabel")}
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div
              data-provider="google"
              title="Google"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: chipBg,
                border: chipBorder,
                fontSize: 11,
                fontWeight: 600,
                color: chipText,
              }}
            >
              <GoogleIcon />
              <span>Google</span>
            </div>

            <div
              data-provider="microsoft"
              title="Microsoft"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: chipBg,
                border: chipBorder,
                fontSize: 11,
                fontWeight: 600,
                color: chipText,
              }}
            >
              <MicrosoftIcon />
              <span>Microsoft</span>
            </div>

            <div
              data-provider="apple"
              title="Apple"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: chipBg,
                border: chipBorder,
                fontSize: 11,
                fontWeight: 600,
                color: chipText,
              }}
            >
              <AppleIcon color={isDark ? "#EDF1F5" : "#0A1220"} />
              <span>Apple</span>
            </div>

            <div
              data-provider="yahoo"
              title="Yahoo"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: chipBg,
                border: chipBorder,
                fontSize: 11,
                fontWeight: 600,
                color: chipText,
              }}
            >
              <YahooIcon />
              <span>Yahoo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 8: Institutional Governance & Security Disclaimer */}
      <p
        style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: 11,
          lineHeight: 1.4,
          color: isDark ? "#7C8A9C" : "#718096",
          paddingTop: 16,
          borderTop: headerBorder,
        }}
      >
        {t("loginCard.disclaimerNote")}
      </p>
    </div>
  );
}
