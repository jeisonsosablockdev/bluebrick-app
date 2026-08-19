export interface ReferralSummaryEntity {
  referralCode: string;
  referralLink: string;
  totalInvitees: number;
  activeInvestors: number;
  totalCommissionsEarnedUsd: number;
  pendingPayoutUsd: number;
}

export interface InviteeEntity {
  id: string;
  maskedWalletOrEmail: string;
  joinedAt: string;
  status: 'QUALIFIED' | 'PENDING_INVESTMENT';
  commissionEarnedUsd: number;
}
