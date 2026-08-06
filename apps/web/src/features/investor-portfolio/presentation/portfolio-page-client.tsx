'use client';

import React from 'react';
import { InvestorHoldingEntity, DividendAnalyticsEntity } from '../domain';
import { PortfolioSummaryBanner } from './portfolio-summary-banner';
import { PortfolioHoldingsGrid } from './portfolio-holdings-grid';

export interface PortfolioPageClientProps {
  holdings: InvestorHoldingEntity[];
  analytics: DividendAnalyticsEntity;
}

export function PortfolioPageClient({ holdings, analytics }: PortfolioPageClientProps) {
  return (
    <section className="space-y-6">
      <PortfolioSummaryBanner holdings={holdings} analytics={analytics} />
      <PortfolioHoldingsGrid holdings={holdings} />
    </section>
  );
}
