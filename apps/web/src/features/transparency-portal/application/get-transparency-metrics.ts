import { TransparencyRepository } from '../infrastructure';
import { InvestmentStrategyModel, TransparencyPlatformSummary } from '../domain';

export async function getTransparencyMetricsQuery(): Promise<{
  summary: TransparencyPlatformSummary;
  models: InvestmentStrategyModel[];
}> {
  const repository = new TransparencyRepository();
  const [summary, models] = await Promise.all([
    repository.getPlatformSummary(),
    repository.getInvestmentModels(),
  ]);

  return { summary, models };
}
