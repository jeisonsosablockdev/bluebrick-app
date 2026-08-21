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

export default async function AdminTreasurySquadsPage({ searchParams }: AdminTreasurySquadsPageProps) {
  if (!isReleaseControlledRouteVisible("/admin/treasury")) {
    notFound();
  }

  const { runId } = await searchParams;

  return <SquadsMultisigConsole runId={runId} />;
}
