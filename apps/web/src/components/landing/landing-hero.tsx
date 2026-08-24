/**
 * @file apps/web/src/components/landing/landing-hero.tsx
 * @description Layer 1: Presentation - Landing Page Hero Header Component.
 * Features luxury dark branding, value proposition badge, and headline typography.
 */

import React from "react";
import { BlueBrickMark } from "@/components/dashboard/blue-brick-mark";
import { Sparkles, ShieldCheck } from "lucide-react";

/**
 * LandingHero presents the BlueBrick investor portal headline and luxury theme tokens.
 */
export function LandingHero(): React.JSX.Element {
  // Step 1: Render top brand header with logo emblem
  return (
    <header className="flex w-full flex-col items-center text-center">
      {/* Brand Emblem & Logo */}
      <div className="flex items-center gap-3">
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
          BLUE BRICK
        </span>
      </div>

      {/* Trust & Category Tag */}
      <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[rgba(47,143,107,0.35)] bg-[rgba(47,143,107,0.12)] px-4 py-1 text-xs font-semibold text-[#57B98C]">
        <Sparkles size={14} />
        Plataforma Privada de Inversión Inmobiliaria Fraccionada
      </div>

      {/* Primary Headline */}
      <h1
        className="mt-6 max-w-2xl font-bold tracking-tight text-[#EDF1F5]"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(32px, 4vw, 48px)",
          lineHeight: 1.15,
        }}
      >
        Invierte en activos inmobiliarios premium con retornos transparentes
      </h1>

      {/* Subtitle description */}
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#7C8A9C] sm:text-base">
        Accede a tu portafolio institucional, monitorea distribuciones mensuales,
        consulta el rendimiento ponderado y reinvierte capital en oportunidades exclusivas.
      </p>

      {/* Security indicator */}
      <div className="mt-4 flex items-center gap-2 text-xs text-[#7C8A9C]">
        <ShieldCheck size={14} className="text-[#57B98C]" />
        <span>Gobernanza institucional · Seguridad WorkOS AuthKit & Neon Cloud</span>
      </div>
    </header>
  );
}
