export function calculateStakingYieldUsd(stakedTokens: number, pricePerTokenUsd: number, apyPercent: number, daysStaked: number): number {
  const principalUsd = stakedTokens * pricePerTokenUsd;
  const annualYield = principalUsd * (apyPercent / 100);
  return Number(((annualYield / 365) * daysStaked).toFixed(2));
}
