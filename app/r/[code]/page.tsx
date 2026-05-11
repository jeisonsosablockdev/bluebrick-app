import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReferralShareLanding } from "@/components/referrals/referral-share-landing";
import { getReferralPreviewByCode } from "@/lib/referrals/preview-service";
import { createPageMetadata } from "@/lib/seo";

type ReferralSharePageParams = {
  code: string;
};

export async function generateMetadata({
  params
}: {
  params: Promise<ReferralSharePageParams>;
}): Promise<Metadata> {
  const { code } = await params;
  const preview = await getReferralPreviewByCode({ code });

  if (!preview) {
    return createPageMetadata({
      title: "Referral Invite",
      description: "Referral landing page for BRIDS onboarding.",
      path: `/r/${code}`,
      explicitNoIndex: true
    });
  }

  return createPageMetadata({
    title: `Invitation from ${preview.referrerWalletDisplay}`,
    description: `Open this referral invite from ${preview.referrerWalletDisplay} to continue onboarding on BRIDS.`,
    path: `/r/${preview.code}`,
    explicitNoIndex: true
  });
}

export default async function ReferralSharePage({
  params
}: {
  params: Promise<ReferralSharePageParams>;
}) {
  const { code } = await params;
  const preview = await getReferralPreviewByCode({ code });

  if (!preview) {
    notFound();
  }

  return (
    <ReferralShareLanding
      referralCode={preview.code}
      referrerWalletDisplay={preview.referrerWalletDisplay}
    />
  );
}
