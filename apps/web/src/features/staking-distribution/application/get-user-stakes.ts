import { StakingDrizzleRepository } from '../infrastructure';
import { StakingPoolEntity } from '../domain';

export async function getUserStakesQuery(walletAddress: string): Promise<StakingPoolEntity[]> {
  const repo = new StakingDrizzleRepository();
  return repo.getUserStakes(walletAddress);
}
