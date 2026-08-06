import { PortfolioDrizzleRepository } from '../infrastructure';
import { InvestorHoldingEntity, DividendAnalyticsEntity } from '../domain';

export async function getInvestorPortfolioQuery(walletAddress: string): Promise<{
  holdings: InvestorHoldingEntity[];
  analytics: DividendAnalyticsEntity;
}> {
  const repo = new PortfolioDrizzleRepository();
  const [holdings, analytics] = await Promise.all([
    repo.getHoldingsByWallet(walletAddress),
    repo.getDividendAnalyticsByWallet(walletAddress),
  ]);

  return { holdings, analytics };
}
