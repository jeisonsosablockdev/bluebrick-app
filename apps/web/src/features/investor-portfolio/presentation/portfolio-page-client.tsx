'use client';

import React from 'react';
import { InvestorHoldingEntity, DividendAnalyticsEntity } from '../domain';
import { PortfolioSummaryBanner } from './portfolio-summary-banner';

export interface PortfolioPageClientProps {
  holdings: InvestorHoldingEntity[];
  analytics: DividendAnalyticsEntity;
  showHoldingsGrid?: boolean;
}

export function PortfolioPageClient({ holdings, analytics, showHoldingsGrid = false }: PortfolioPageClientProps) {
  return (
    <section className="space-y-6">
      <PortfolioSummaryBanner holdings={holdings} analytics={analytics} />
    </section>
  );
}
