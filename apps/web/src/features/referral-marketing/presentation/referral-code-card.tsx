'use client';

import React, { useState } from 'react';
import { ReferralSummaryEntity } from '../domain';
import { Card, Button } from '../../shared/ui';

export interface ReferralCodeCardProps {
  summary: ReferralSummaryEntity;
}

export function ReferralCodeCard({ summary }: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(summary.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Tu Enlace de Referido</h3>
          <p className="text-xs text-slate-400">Gana hasta 5% en comisiones multinivel por cada inversión realizada por tus invitados.</p>
        </div>
        <div className="p-2 px-4 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-sm font-bold self-start sm:self-auto">
          Código: {summary.referralCode}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <input
          readOnly
          value={summary.referralLink}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
        />
        <Button variant="primary" className="text-xs py-2 px-4" onClick={handleCopy}>
          {copied ? '¡Copiado!' : 'Copiar Link'}
        </Button>
      </div>
    </Card>
  );
}
