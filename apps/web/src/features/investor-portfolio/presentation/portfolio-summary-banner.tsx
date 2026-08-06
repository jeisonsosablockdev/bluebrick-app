'use client';

import React from 'react';
import { DividendAnalyticsEntity, InvestorHoldingEntity } from '../domain';

export interface PortfolioSummaryBannerProps {
  holdings: InvestorHoldingEntity[];
  analytics: DividendAnalyticsEntity;
}

export function PortfolioSummaryBanner({ holdings, analytics }: PortfolioSummaryBannerProps) {
  const totalValuation = holdings.reduce((acc, h) => acc + h.currentValuationUsd, 0);
  const totalInvested = holdings.reduce((acc, h) => acc + h.totalInvestedUsd, 0);
  const totalGain = totalValuation - totalInvested;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Valor Total del Portafolio</span>
        <div className="text-2xl font-bold text-slate-100 mt-1">${totalValuation.toLocaleString()} USD</div>
        <span className="text-xs text-emerald-400 font-medium">+{((totalGain / totalInvested) * 100).toFixed(1)}% de plusvalía</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Total Invertido</span>
        <div className="text-2xl font-bold text-slate-100 mt-1">${totalInvested.toLocaleString()} USD</div>
        <span className="text-xs text-slate-400 font-medium">{holdings.length} Inmuebles Activos</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Dividendos Cobrados</span>
        <div className="text-2xl font-bold text-emerald-400 mt-1">${analytics.totalDividendsEarnedUsd.toFixed(2)} USD</div>
        <span className="text-xs text-slate-400 font-medium">{analytics.historicalPayoutsCount} pagos mensuales</span>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Rentas Pendientes (Claim)</span>
        <div className="text-2xl font-bold text-cyan-400 mt-1">${analytics.pendingClaimUsd.toFixed(2)} USD</div>
        <span className="text-xs text-cyan-300 font-medium">Disponible para reclamo</span>
      </div>
    </div>
  );
}
