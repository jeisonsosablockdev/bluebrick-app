/**
 * @file apps/web/src/components/landing/investor-login-card.tsx
 * @description Layer 1: Presentation - Investor Entrypoint Card with Google Login & Demo Mode.
 * Presents Google OAuth Sign-in button powered by WorkOS AuthKit and 1-click demo entry.
 */

"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, UserCheck, Lock, ShieldCheck } from "lucide-react";

export interface InvestorLoginCardProps {
  investorName?: string;
  tier?: string;
  initials?: string;
}

function GoogleEmblem() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
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
 * InvestorLoginCard displays the investor entry card with Google Sign-in and instant demo access.
 */
export function InvestorLoginCard({
  investorName = "Sofía Martínez",
  tier = "Inversionista Privada",
  initials = "SM",
}: InvestorLoginCardProps): React.JSX.Element {
  // Step 1: Render luxury card container
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
      {/* Step 2: Card Header & Security Badge */}
      <div className="flex items-center justify-between border-b border-[rgba(237,241,245,0.08)] pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7C8A9C]">
          <Lock size={14} className="text-[#E8495F]" />
          Portal de Inversionistas
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[rgba(87,185,140,0.12)] px-2.5 py-0.5 text-[11px] font-semibold text-[#57B98C] border border-[rgba(87,185,140,0.3)]">
          <ShieldCheck size={12} />
          Acceso Seguro
        </span>
      </div>

      {/* Step 3: Google Login Primary CTA Button */}
      <div className="my-6">
        <a
          href="/auth/login"
          className="group flex w-full items-center justify-center gap-3 rounded-xl py-3.5 px-4 text-sm font-semibold text-[#0A1220] bg-[#EDF1F5] hover:bg-white transition-all shadow-lg hover:shadow-xl active:scale-[0.98] cursor-pointer"
        >
          <GoogleEmblem />
          <span>Continuar con Google</span>
          <ArrowRight size={16} className="text-[#7C8A9C] ml-auto transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>

      {/* Step 4: Divider */}
      <div className="flex items-center gap-3 my-5 text-[#7C8A9C] text-xs">
        <div className="flex-1 h-px bg-[rgba(237,241,245,0.08)]" />
        <span className="uppercase tracking-wider text-[10px]">O probar cuenta demo</span>
        <div className="flex-1 h-px bg-[rgba(237,241,245,0.08)]" />
      </div>

      {/* Step 5: Demo Investor Profile Summary & Quick Access */}
      <div className="flex items-center justify-between gap-4 rounded-xl bg-[rgba(10,18,32,0.6)] p-3.5 border border-[rgba(237,241,245,0.06)]">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2F8F6B, #173F30)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
              color: "#EDF1F5",
              border: "1px solid rgba(196, 18, 48, 0.4)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#EDF1F5] truncate">
              <UserCheck size={13} className="text-[#57B98C] shrink-0" />
              <span className="truncate">{investorName}</span>
            </div>
            <div
              className="text-[11px] text-[#7C8A9C] truncate"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {tier} · 5 Proyectos
            </div>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="shrink-0 flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-[#EDF1F5] bg-[rgba(237,241,245,0.08)] hover:bg-[rgba(237,241,245,0.15)] border border-[rgba(237,241,245,0.1)] transition-all"
        >
          <span>Demo</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {/* Step 6: Security Note */}
      <p className="mt-5 text-center text-[11px] text-[#7C8A9C]">
        Autenticación segura federada con WorkOS AuthKit & Neon Database.
      </p>
    </div>
  );
}
