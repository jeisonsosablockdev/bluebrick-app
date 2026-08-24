/**
 * @file apps/web/src/components/landing/investor-login-card.tsx
 * @description Layer 1: Presentation - Investor Entrypoint Card with Mock Login Action.
 * Presents investor profile summary and provides 1-click transition to /dashboard.
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
        maxWidth: 480,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
      }}
    >
      {/* Step 2: Card Header & Demo Account Badge */}
      <div className="flex items-center justify-between border-b border-[rgba(237,241,245,0.08)] pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C8A9C]">
          <Lock size={14} className="text-[#E8495F]" />
          Acceso de Inversionista
        </div>
        <span className="rounded-full bg-[rgba(87,185,140,0.12)] px-2.5 py-0.5 text-[11px] font-semibold text-[#57B98C] border border-[rgba(87,185,140,0.3)]">
          Demo Verificada
        </span>
      </div>

      {/* Step 3: Investor Profile Summary */}
      <div className="my-6 flex items-center gap-4 rounded-xl bg-[rgba(10,18,32,0.6)] p-4 border border-[rgba(237,241,245,0.06)]">
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
          <div className="flex items-center gap-1.5 text-sm font-semibold text-[#EDF1F5]">
            <UserCheck size={14} className="text-[#57B98C]" />
            {investorName}
          </div>
          <div
            className="text-xs text-[#7C8A9C]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {tier} · 5 Proyectos Activos
          </div>
        </div>
      </div>

      {/* Step 4: 1-Click Mock Login CTA Button */}
      <Link
        href="/dashboard"
        className="group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-[#0A1220] transition-all hover:brightness-110 active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #E8495F, #C41230)",
          boxShadow: "0 8px 24px rgba(196, 18, 48, 0.35)",
        }}
      >
        <span>Entrar al Dashboard</span>
        <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      </Link>

      {/* Step 5: Helper note */}
      <p className="mt-4 text-center text-[11px] text-[#7C8A9C]">
        * Acceso seguro: Demo instantánea pre-cargada con sincronización Neon Postgres y WorkOS.
      </p>
    </div>
  );
}
