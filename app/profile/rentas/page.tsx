import type { Metadata } from "next";
import { getUserStakesQuery, StakingPageClient } from "../../../apps/web/src/features/staking-distribution";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Rentas y Distribuciones",
  description: "Reclama tus dividendos mensuales distribuidos mediante tesoreria Squads v4.",
  path: "/profile/rentas",
  section: "profile"
});

export default async function ProfileRentasPage() {
  const stakes = await getUserStakesQuery("SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45");

  return <StakingPageClient stakes={stakes} />;
}
