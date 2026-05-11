import { notFound } from "next/navigation";

import { DistributionsConsole } from "@/components/admin/distributions-console";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

export default function AdminDistributionsPage() {
  if (!isReleaseControlledRouteVisible("/admin/distributions")) {
    notFound();
  }

  return <DistributionsConsole />;
}
