'use client';

import React from 'react';
import { MetaplexCollectionConfig } from '../domain';
import { Card } from '../../shared/ui';

export interface CandyMachineProgressProps {
  config: MetaplexCollectionConfig;
}

export function CandyMachineProgress({ config }: CandyMachineProgressProps) {
  const percentRedeemed = Math.round((config.itemsRedeemed / config.itemsAvailable) * 100);

  return (
    <Card className="space-y-3">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400 font-medium">Progreso Candy Machine v3</span>
        <span className="text-emerald-400 font-bold">{percentRedeemed}% Minted ({config.itemsRedeemed} / {config.itemsAvailable})</span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${percentRedeemed}%` }} />
      </div>
    </Card>
  );
}
