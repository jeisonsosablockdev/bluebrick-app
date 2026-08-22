/**
 * =========================================================================================
 * Layer 1: Presentation Layer — Server Component Page
 * Route: /admin/treasury/squads
 * Description: Server-side route handler for the Squads v4 treasury console. Enforces release
 *              visibility gates and passes searchParams parameters to the presentation client.
 * =========================================================================================
 */

import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SquadsMultisigConsole } from "@/features/admin/presentation/squads-multisig-console";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Squads Treasury Multisig",
  description: "Squads v4 treasury authorization, date audit inspection, and settlement proposal governance.",
  path: "/admin/treasury/squads",
  section: "admin",
  explicitNoIndex: true
});

type AdminTreasurySquadsPageProps = {
  searchParams: Promise<{
    runId?: string;
  }>;
};

/**
 * Server page component for the Squads Treasury Multisig Console.
 */
export default async function AdminTreasurySquadsPage({ searchParams }: AdminTreasurySquadsPageProps) {
  // Step 1: Enforce release-controlled visibility gate
  if (!isReleaseControlledRouteVisible("/admin/treasury")) {
    notFound();
  }

  // Step 2: Await search parameters safely
  const { runId } = await searchParams;

  // Step 3: Render client-side multisig console
  return <SquadsMultisigConsole runId={runId} />;
}
