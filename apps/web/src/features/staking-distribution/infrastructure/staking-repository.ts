import { StakingPoolEntity } from '../domain';

export class StakingDrizzleRepository {
  async getUserStakes(walletAddress: string): Promise<StakingPoolEntity[]> {
    return [
      {
        id: 'stake_01',
        propertyTitle: 'Torre Residencial Brickell Sunset',
        stakedTokensCount: 12,
        annualApyPercent: 11.4,
        accruedYieldUsd: 184.20,
        claimableYieldUsd: 42.10,
      },
      {
        id: 'stake_02',
        propertyTitle: 'Villa de Lujo Tulum Oasis',
        stakedTokensCount: 5,
        annualApyPercent: 12.8,
        accruedYieldUsd: 100.30,
        claimableYieldUsd: 25.50,
      },
    ];
  }
}
