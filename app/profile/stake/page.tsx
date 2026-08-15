import type { Metadata } from "next";
import { StakingPageClient } from "@/features/staking-distribution";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Stake / Unstake",
  description: "Gestiona el estado de staking de tus activos e inmubeles tokenizados en Solana Devnet.",
  path: "/profile/stake",
  section: "profile"
});

export default function ProfileStakePage() {
  return <StakingPageClient />;
}
