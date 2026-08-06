'use client';

import React from 'react';
import { Card } from '../../shared/ui';

export function AdminDashboardHeader() {
  return (
    <Card className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Consola de Administración y Gobernanza</h2>
        <p className="text-xs text-slate-400">Control total del protocolo, minting Metaplex, tesorería Squads v4 y auditoría RBAC.</p>
      </div>
      <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold self-start md:self-auto">
        Solana Devnet: OPERACIONAL
      </div>
    </Card>
  );
}
