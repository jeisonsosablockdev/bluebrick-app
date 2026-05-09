import { notFound } from "next/navigation";

import { PortfolioModule } from "@/components/dashboard/portfolio-module";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

export default function PortfolioPage() {
  if (!isReleaseControlledRouteVisible("/protected/portfolio")) {
    notFound();
  }

  return <PortfolioModule />;
}
