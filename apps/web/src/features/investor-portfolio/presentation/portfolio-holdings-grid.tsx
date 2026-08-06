'use client';

import React from 'react';
import { InvestorHoldingEntity } from '../domain';
import { Card, Button } from '../../shared/ui';

export interface PortfolioHoldingsGridProps {
  holdings: InvestorHoldingEntity[];
}

export function PortfolioHoldingsGrid({ holdings }: PortfolioHoldingsGridProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-100">Tus Fracciones Inmobiliarias</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {holdings.map((item) => (
          <Card key={item.assetId} className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-100 text-base">{item.propertyName}</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-bold">
                  {item.estimatedApyPercent}% APY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{item.location}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Fracciones:</span>
                <p className="font-bold text-slate-200">{item.fractionsOwned} tokens</p>
              </div>
              <div>
                <span className="text-slate-400">Valor Actual:</span>
                <p className="font-bold text-emerald-400">${item.currentValuationUsd} USD</p>
              </div>
            </div>

            <Button variant="outline" className="w-full text-xs">Ver Detalle del Token en Solana</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
