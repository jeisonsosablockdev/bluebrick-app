import { notFound } from "next/navigation";

import { StakeModule } from "@/components/dashboard/stake-module";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

export default function StakePage() {
  if (!isReleaseControlledRouteVisible("/protected/stake")) {
    notFound();
  }

  return <StakeModule />;
}
