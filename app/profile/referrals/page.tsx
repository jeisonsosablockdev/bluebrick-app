import type { Metadata } from "next";
import { getReferralSummaryQuery, ReferralPageClient } from "@/features/referral-marketing";
import { ReferralProgramModule } from "@/components/dashboard/referral-program-module";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Recompensas por Referidos",
  description: "Comparte tu codigo de referido, sigue el progreso de invitados y revisa recompensas ganadas.",
  path: "/profile/referrals",
  section: "profile"
});

export default async function ProfileReferralsPage() {
  const { summary, invitees } = await getReferralSummaryQuery('SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45');

  return (
    <div className="space-y-6">
      <ReferralPageClient summary={summary} invitees={invitees} />
      <ReferralProgramModule />
    </div>
  );
}
