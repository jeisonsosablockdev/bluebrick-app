/**
 * @file apps/web/src/components/landing/investor-login-card.tsx
 * @description Layer 1: Presentation - Investor Entrypoint Card with Multi-Language Localization & Universal Email Auth.
 * Presents investor profile summary with 1-click dashboard entry and universal email login (WorkOS AuthKit).
 */

"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, UserCheck, Lock, Mail } from "lucide-react";
import { useI18n } from "@/features/i18n";

export interface InvestorLoginCardProps {
  investorName?: string;
  tier?: string;
  initials?: string;
}

/**
 * InvestorLoginCard displays the investor entry card with direct dashboard navigation and universal email login.
 */
export function InvestorLoginCard({
  investorName = "Sofía Martínez",
  tier,
  initials = "SM",
}: InvestorLoginCardProps): React.JSX.Element {
  // Step 1: Access localized translation strings
  const { t } = useI18n();

  const displayTier = tier || t("loginCard.tierLabel");

  // Step 2: Render stylized login card container matching luxury dark theme tokens
  return (
    <div
      style={{
        background: "linear-gradient(160deg, #111B2E 0%, #0D1526 100%)",
        border: "1px solid rgba(237, 241, 245, 0.1)",
        borderRadius: 20,
        padding: "32px",
        width: "100%",
        maxWidth: 460,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Step 3: Card Header & Demo Account Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(237,241,245,0.08)",
          paddingBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#7C8A9C" }}>
          <Lock size={14} color="#E8495F" />
          {t("loginCard.headerTitle")}
        </div>
        <span
          style={{
            borderRadius: 999,
            background: "rgba(87,185,140,0.12)",
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#57B98C",
            border: "1px solid rgba(87,185,140,0.3)",
          }}
        >
          {t("loginCard.verifiedBadge")}
        </span>
      </div>

      {/* Step 4: Investor Profile Summary */}
      <div
        style={{
          margin: "24px 0",
          display: "flex",
          alignItems: "center",
          gap: 16,
          borderRadius: 14,
          background: "rgba(10,18,32,0.6)",
          padding: 16,
          border: "1px solid rgba(237,241,245,0.06)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2F8F6B, #173F30)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
            color: "#EDF1F5",
            border: "1px solid rgba(196, 18, 48, 0.4)",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#EDF1F5" }}>
            <UserCheck size={14} color="#57B98C" />
            {investorName}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#7C8A9C",
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: 2,
            }}
          >
            {displayTier} · {t("loginCard.activeProjectsCount", { count: 5 })}
          </div>
        </div>
      </div>

      {/* Step 5: Primary 1-Click Entry Button */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 12,
            padding: "14px",
            fontSize: 14,
            fontWeight: 700,
            color: "#0A1220",
            background: "linear-gradient(135deg, #E8495F, #C41230)",
            boxShadow: "0 8px 24px rgba(196, 18, 48, 0.35)",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <span>{t("loginCard.enterDashboardButton")}</span>
          <ArrowRight size={16} />
        </Link>

        {/* Step 6: Universal Email Authentication Link (WorkOS AuthKit) */}
        <a
          href="/auth/login"
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 12,
            padding: "12px",
            fontSize: 13,
            fontWeight: 600,
            color: "#EDF1F5",
            background: "rgba(237,241,245,0.05)",
            border: "1px solid rgba(237,241,245,0.12)",
            textDecoration: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <Mail size={16} color="#57B98C" />
          <span>{t("loginCard.emailLoginButton")}</span>
        </a>
      </div>

      {/* Step 7: Helper Note */}
      <p style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#7C8A9C" }}>
        {t("loginCard.disclaimerNote")}
      </p>
    </div>
  );
}
