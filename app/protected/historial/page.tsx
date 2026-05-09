import { notFound } from "next/navigation";

import { HistorialModule } from "@/components/dashboard/historial-module";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

export default function HistorialPage() {
  if (!isReleaseControlledRouteVisible("/protected/historial")) {
    notFound();
  }

  return <HistorialModule />;
}
