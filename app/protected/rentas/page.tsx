import { notFound } from "next/navigation";

import { RentasModule } from "@/components/dashboard/rentas-module";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

export default function RentasPage() {
  if (!isReleaseControlledRouteVisible("/protected/rentas")) {
    notFound();
  }

  return <RentasModule />;
}
