import { findReferralCodeByCode } from "@/features/referral-marketing/infrastructure/referrals-repository";

export type ReferralPreviewRecord = {
  code: string;
  referrerWalletDisplay: string;
};

function truncateWalletPublicKey(walletPublicKey: string): string {
  return `${walletPublicKey.slice(0, 4)}...${walletPublicKey.slice(-4)}`;
}

export async function getReferralPreviewByCode(input: {
  code: string;
}): Promise<ReferralPreviewRecord | null> {
  const referralCode = await findReferralCodeByCode({ code: input.code });
  if (!referralCode) {
    return null;
  }

  return {
    code: referralCode.code,
    referrerWalletDisplay: truncateWalletPublicKey(referralCode.referrerWalletPublicKey)
  };
}
