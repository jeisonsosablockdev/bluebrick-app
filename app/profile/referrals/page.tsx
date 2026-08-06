import type { Metadata } from "next";
import { ReferralPageClient } from "../../../apps/web/src/features/referral-marketing";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Recompensas por Referidos",
  description: "Comparte tu codigo de referido, sigue el progreso de invitados y revisa recompensas ganadas.",
  path: "/profile/referrals",
  section: "profile"
});

export default function ProfileReferralsPage() {
  return <ReferralPageClient />;
}
