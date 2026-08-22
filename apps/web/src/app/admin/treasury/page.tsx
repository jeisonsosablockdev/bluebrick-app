/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Server Component Page
 * Route: /admin/treasury
 * Module: AdminTreasuryPage
 *
 * Description:
 * Next.js 16 App Router server page component for the Admin Treasury Overview.
 * Enforces release visibility gates, provides SEO metadata with explicit no-index,
 * and streams the interactive client console with Suspense boundaries.
 * =========================================================================================
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { TreasuryConsole } from "@/features/admin/presentation/treasury-console";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Tesorería y Gobernanza",
  description: "Supervisión de balances, propuestas de cambio de fechas y controles multisig de Squads v4.",
  path: "/admin/treasury",
  section: "admin",
  explicitNoIndex: true
});

/**
 * Server Component Page for /admin/treasury
 */
export default function AdminTreasuryPage() {
  // Step 1: Enforce release-controlled feature flag gate
  if (!isReleaseControlledRouteVisible("/admin/treasury")) {
    notFound();
  }

  // Step 2: Render client-side interactive console within Suspense boundary
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-secondary/30 rounded w-1/3" />
          <div className="h-48 bg-secondary/20 rounded border border-border/40" />
          <div className="h-48 bg-secondary/20 rounded border border-border/40" />
        </div>
      }
    >
      <TreasuryConsole />
    </Suspense>
  );
}
