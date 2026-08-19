'use client';

import React from 'react';
import { MetaplexCollectionConfig } from '../domain';
import { CandyMachineProgress } from './candy-machine-progress';
import { MintButtonCta } from './mint-button-cta';

export interface NftMintingPageClientProps {
  config: MetaplexCollectionConfig;
}

export function NftMintingPageClient({ config }: NftMintingPageClientProps) {
  return (
    <section className="space-y-6">
      <CandyMachineProgress config={config} />
      <MintButtonCta config={config} />
    </section>
  );
}
