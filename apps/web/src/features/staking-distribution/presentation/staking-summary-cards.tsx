'use client';

import React from 'react';
import { StakingPoolEntity } from '../domain';
import { Card, Button } from '../../shared/ui';

export interface StakingSummaryCardsProps {
  stakes: StakingPoolEntity[];
}

export function StakingSummaryCards({ stakes }: StakingSummaryCardsProps) {
  const totalStakedTokens = stakes.reduce((acc, curr) => acc + curr.stakedTokensCount, 0);
  const totalClaimableYieldUsd = stakes.reduce((acc, curr) => acc + curr.claimableYieldUsd, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="flex flex-col justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium">Total Fracciones en Staking</span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{totalStakedTokens} Tokens Activos</div>
        </div>
        <p className="text-xs text-slate-500 mt-2">Generando rendimientos pasivos mensuales on-chain.</p>
      </Card>

      <Card className="flex flex-col justify-between border-emerald-500/30 bg-emerald-950/10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-400 font-semibold">Rentas Pendientes (Claimable)</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">${totalClaimableYieldUsd.toFixed(2)} USD</div>
          </div>
          <Button variant="primary" className="text-xs py-2 px-4 bg-emerald-500 hover:bg-emerald-600">
            Reclamar Rendimientos
          </Button>
        </div>
        <p className="text-xs text-emerald-500/80 mt-2">Pagos liquidados mediante tesorería Squads v4 en Solana Devnet.</p>
      </Card>
    </div>
  );
}
