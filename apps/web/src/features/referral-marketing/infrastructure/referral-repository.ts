import { ReferralSummaryEntity, InviteeEntity } from '../domain';

export class ReferralDrizzleRepository {
  async getSummaryByWallet(walletAddress: string): Promise<ReferralSummaryEntity> {
    const code = walletAddress ? walletAddress.slice(0, 8).toUpperCase() : 'BRIDS2026';
    return {
      referralCode: code,
      referralLink: `https://brids.io/r/${code}`,
      totalInvitees: 14,
      activeInvestors: 9,
      totalCommissionsEarnedUsd: 450.0,
      pendingPayoutUsd: 75.0,
    };
  }

  async getInviteesByWallet(walletAddress: string): Promise<InviteeEntity[]> {
    return [
      {
        id: 'inv_01',
        maskedWalletOrEmail: '0x8f...3a19',
        joinedAt: '2026-07-28',
        status: 'QUALIFIED',
        commissionEarnedUsd: 50.0,
      },
      {
        id: 'inv_02',
        maskedWalletOrEmail: 'user2@gmail.com',
        joinedAt: '2026-08-01',
        status: 'PENDING_INVESTMENT',
        commissionEarnedUsd: 0.0,
      },
    ];
  }
}
