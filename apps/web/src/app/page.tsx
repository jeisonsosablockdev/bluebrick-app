/**
 * @file apps/web/src/app/page.tsx
 * @description Layer 1: Presentation - BlueBrick Investor Platform Entrypoint.
 * Renders the luxury dark landing hero and the 1-click investor mock login card.
 */

import React from "react";
import { LandingHero } from "@/components/landing/landing-hero";
import { InvestorLoginCard } from "@/components/landing/investor-login-card";

export default function HomePage(): React.JSX.Element {
  // Step 1: Render the landing page with luxury dark radial backdrop styling
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between py-12 px-6 sm:px-12 selection:bg-[#C41230] selection:text-[#EDF1F5]"
      style={{
        background:
          "radial-gradient(1200px 600px at 15% -10%, rgba(196, 18, 48, 0.12), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(47, 143, 107, 0.12), transparent), #0A1220",
        fontFamily: "'Inter', sans-serif",
        color: "#EDF1F5",
      }}
    >
      {/* Step 2: Top Hero Branding Section */}
      <main className="w-full max-w-4xl flex flex-col items-center my-auto gap-12">
        <LandingHero />

        {/* Step 3: Interactive Investor Mock Login Access Card */}
        <div className="w-full flex justify-center">
          <InvestorLoginCard
            investorName="Sofía Martínez"
            tier="Inversionista Privada"
            initials="SM"
          />
        </div>
      </main>

      {/* Step 4: Governance & Compliance Footer */}
      <footer className="mt-16 text-center text-xs text-[#7C8A9C]">
        <p>BlueBrick Platform · Inversiones Inmobiliarias Fraccionadas · Conectado a Vercel Cloud</p>
      </footer>
    </div>
  );
}

