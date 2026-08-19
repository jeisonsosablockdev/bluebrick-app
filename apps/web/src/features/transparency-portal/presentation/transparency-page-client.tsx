'use client';

import React from 'react';
import { InvestmentStrategyModel, TransparencyPlatformSummary } from '../domain';
import { StrategyDashboard } from './strategy-dashboard';

export interface TransparencyPageClientProps {
  summary: TransparencyPlatformSummary;
  models: InvestmentStrategyModel[];
}

export function TransparencyPageClient({ summary, models }: TransparencyPageClientProps) {
  return (
    <main className="max-w-6xl mx-auto py-12 px-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-100">Portal de Transparencia & Estrategia On-Chain</h1>
        <p className="text-slate-400 max-w-3xl">
          Auditoría pública en tiempo real de los modelos de inversión de BRIDS, respaldada por firmas multisig Squads v4 y contratos inteligentes en Solana.
        </p>
      </div>

      <StrategyDashboard summary={summary} models={models} />
    </main>
  );
}
