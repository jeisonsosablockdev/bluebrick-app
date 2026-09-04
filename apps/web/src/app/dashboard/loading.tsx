/**
 * @file apps/web/src/app/dashboard/loading.tsx
 * @description Layer 1: Presentation - Next.js 16 Instant Static Shell skeleton for /dashboard.
 * Commits immediately during client-side navigation (instant navigation) while server-side
 * database and auth sessions resolve, eliminating layout shifts (CLS = 0).
 */

import React from "react";
import { BlueBrickLogo } from "@/components/dashboard/blue-brick-logo";

/**
 * DashboardLoading renders the instant static shell skeleton for the investment dashboard.
 */
export default function DashboardLoading(): React.JSX.Element {
  // Step 1: Render luxury brand header and pulse skeletons
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 15% -10%, rgba(196,18,48,0.08), transparent), radial-gradient(1000px 500px at 100% 0%, rgba(47,143,107,0.10), transparent), #0A1220",
        fontFamily: "'Inter', sans-serif",
        color: "#EDF1F5",
        paddingBottom: "64px",
      }}
      aria-busy="true"
      aria-label="Cargando panel de inversión"
    >
      {/* ---------- TOP NAV SKELETON ---------- */}
      <header className="dash-sticky-header">
        <div style={{ display: "flex", alignItems: "center" }}>
          <BlueBrickLogo height={28} priority />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(237,241,245,0.06)",
              animation: "pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          <div
            style={{
              width: 140,
              height: 28,
              borderRadius: 8,
              background: "rgba(237,241,245,0.06)",
              animation: "pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(237,241,245,0.08)",
              animation: "pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        </div>
      </header>

      {/* ---------- MAIN SKELETON GRID ---------- */}
      <main className="dash-main-container">
        <div className="dash-hero-grid">
          {/* Card 1 Skeleton: Total Invested */}
          <div
            style={{
              minHeight: 290,
              borderRadius: 22,
              background: "rgba(10,21,18,0.6)",
              border: "1px solid rgba(47,143,107,0.15)",
              padding: "24px",
              animation: "pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />

          {/* Card 2 Skeleton: Active Investment Carousel */}
          <div
            style={{
              minHeight: 290,
              borderRadius: 22,
              background: "rgba(10,18,32,0.6)",
              border: "1px solid rgba(237,241,245,0.08)",
              padding: "24px",
              animation: "pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        </div>

        {/* Phase Progress Stepper Skeleton */}
        <div
          style={{
            marginTop: 24,
            height: 96,
            borderRadius: 16,
            background: "rgba(10,18,32,0.5)",
            border: "1px solid rgba(237,241,245,0.06)",
            animation: "pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
          }}
        />
      </main>
    </div>
  );
}
