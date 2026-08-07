'use client';

import React from 'react';
import { StakingPoolEntity } from '../domain';
import { StakingSummaryCards } from './staking-summary-cards';
import { ActiveStakesTable } from './active-stakes-table';

export interface StakingPageClientProps {
  stakes: StakingPoolEntity[];
}

export function StakingPageClient({ stakes }: StakingPageClientProps) {
  return (
    <section className="space-y-6">
      <StakingSummaryCards stakes={stakes} />
      <ActiveStakesTable stakes={stakes} />
    </section>
  );
}
