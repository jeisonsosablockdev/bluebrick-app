/**
 * @file apps/web/src/components/landing/investor-login-card.tsx
 * @description Layer 1: Presentation - Investor Entrypoint Card with Mock Login Action & Google OAuth.
 * Presents investor profile summary with 1-click dashboard entry and optional Google login.
 */

"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, UserCheck, Lock } from "lucide-react";

export interface InvestorLoginCardProps {
  investorName?: string;
  tier?: string;
  initials?: string;
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, flexShrink: 0 }}
    >
      <path
        fill="#EA4335"
        d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
      />
    </svg>
  );
}

/**
 * InvestorLoginCard displays the investor entry card with direct dashboard navigation.
 */
export function InvestorLoginCard({
  investorName = "Sofía Martínez",
  tier = "Inversionista Privada",
  initials = "SM",
}: InvestorLoginCardProps): React.JSX.Element {
  // Step 1: Render stylized login card container matching luxury dark theme tokens
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
      {/* Step 2: Card Header & Demo Account Badge */}
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
          Acceso de Inversionista
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
          Demo Verificada
        </span>
      </div>

      {/* Step 3: Investor Profile Summary */}
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
            {tier} · 5 Proyectos Activos
          </div>
        </div>
      </div>

      {/* Step 4: Primary 1-Click Entry Button */}
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
          <span>Entrar al Dashboard</span>
          <ArrowRight size={16} />
        </Link>

        {/* Step 5: Optional Google Sign-In Link */}
        <a
          href="/auth/login"
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 12,
            padding: "10px",
            fontSize: 12,
            fontWeight: 600,
            color: "#EDF1F5",
            background: "rgba(237,241,245,0.04)",
            border: "1px solid rgba(237,241,245,0.08)",
            textDecoration: "none",
            cursor: "pointer",
          }}
        >
          <GoogleIcon />
          <span>Iniciar sesión con Google</span>
        </a>
      </div>

      {/* Step 6: Helper Note */}
      <p style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#7C8A9C" }}>
        * Plataforma de Inversiones BlueBrick · Acceso demo instantáneo o federado.
      </p>
    </div>
  );
}
