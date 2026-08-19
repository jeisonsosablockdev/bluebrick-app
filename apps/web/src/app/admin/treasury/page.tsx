import { notFound } from "next/navigation";

import { TreasuryConsole } from "@/features/admin/presentation/treasury-console";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

export default function AdminTreasuryPage() {
  if (!isReleaseControlledRouteVisible("/admin/treasury")) {
    notFound();
  }

  return <TreasuryConsole />;
}
