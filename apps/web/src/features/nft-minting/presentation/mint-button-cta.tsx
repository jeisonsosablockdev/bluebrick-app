'use client';

import React from 'react';
import { MetaplexCollectionConfig } from '../domain';
import { Button } from '../../shared/ui';

export interface MintButtonCtaProps {
  config: MetaplexCollectionConfig;
}

export function MintButtonCta({ config }: MintButtonCtaProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <Button variant="primary" className="w-full sm:w-auto py-3 px-8 text-sm bg-gradient-to-r from-emerald-500 to-cyan-500 font-bold">
        Acuñar Fracción ({config.priceSol} SOL)
      </Button>
      <span className="text-xs text-slate-400">Transacción Metaplex Core firmada en Solana Devnet.</span>
    </div>
  );
}
