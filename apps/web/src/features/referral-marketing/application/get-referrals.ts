import { ReferralDrizzleRepository } from '../infrastructure';
import { ReferralSummaryEntity, InviteeEntity } from '../domain';

export async function getReferralSummaryQuery(walletAddress: string): Promise<{
  summary: ReferralSummaryEntity;
  invitees: InviteeEntity[];
}> {
  const repo = new ReferralDrizzleRepository();
  const [summary, invitees] = await Promise.all([
    repo.getSummaryByWallet(walletAddress),
    repo.getInviteesByWallet(walletAddress),
  ]);

  return { summary, invitees };
}
