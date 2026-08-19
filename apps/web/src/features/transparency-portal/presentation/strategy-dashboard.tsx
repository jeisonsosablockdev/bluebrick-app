'use client';

import React from 'react';
import { InvestmentStrategyModel, TransparencyPlatformSummary } from '../domain';
import { Card } from '../../shared/ui';

export interface StrategyDashboardProps {
  summary: TransparencyPlatformSummary;
  models: InvestmentStrategyModel[];
}

export function StrategyDashboard({ summary, models }: StrategyDashboardProps) {
  return (
    <div className="space-y-8 my-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Valor Total de Activos (AUM)">
          <p className="text-3xl font-extrabold text-emerald-400">
            ${summary.totalAssetsValueUsd.toLocaleString()} USD
          </p>
        </Card>
        <Card title="Dividendos Distribuidos">
          <p className="text-3xl font-extrabold text-slate-100">
            ${summary.totalDividendsPaidUsd.toLocaleString()} USD
          </p>
        </Card>
        <Card title="Inversionistas Verificados">
          <p className="text-3xl font-extrabold text-indigo-400">
            {summary.verifiedWalletsCount.toLocaleString()} Wallets
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Modelos de Inversión & Auditoría On-Chain</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {models.map((model) => (
            <Card key={model.id} title={model.name}>
              <div className="space-y-2 text-sm text-slate-300">
                <p><span className="text-slate-400">Categoría:</span> {model.category}</p>
                <p><span className="text-slate-400">AUM:</span> ${model.totalAumUsd.toLocaleString()} USD</p>
                <p><span className="text-slate-400">Rendimiento Promedio:</span> <strong className="text-emerald-400">{model.averageApyPercentage}% APY</strong></p>
                <p><span className="text-slate-400">Propiedades Activas:</span> {model.activePropertiesCount}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
