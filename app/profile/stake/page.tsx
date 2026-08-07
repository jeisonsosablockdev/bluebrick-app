import type { Metadata } from "next";
import { getUserStakesQuery, StakingPageClient } from "../../../apps/web/src/features/staking-distribution";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Staking y Rendimientos",
  description: "Bloquea tus fracciones inmobiliarias para devengar rendimientos mensuales en USDC.",
  path: "/profile/stake",
  section: "profile"
});

export default async function ProfileStakePage() {
  const stakes = await getUserStakesQuery("SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45");

  return <StakingPageClient stakes={stakes} />;
}
