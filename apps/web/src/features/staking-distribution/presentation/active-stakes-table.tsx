'use client';

import React from 'react';
import { StakingPoolEntity } from '../domain';
import { Card, Button } from '../../shared/ui';

export interface ActiveStakesTableProps {
  stakes: StakingPoolEntity[];
}

export function ActiveStakesTable({ stakes }: ActiveStakesTableProps) {
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-100">Posiciones de Staking Activas</h3>
        <p className="text-xs text-slate-400">Detalle de fracciones bloqueadas y rendimientos devengados por inmueble.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Inmueble</th>
              <th className="p-3">Fracciones Staked</th>
              <th className="p-3">APY Proyectado</th>
              <th className="p-3">Acumulado Histórico</th>
              <th className="p-3">Disponible Reclamo</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {stakes.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900/40">
                <td className="p-3 font-bold text-slate-100">{item.propertyTitle}</td>
                <td className="p-3 text-slate-300">{item.stakedTokensCount} tokens</td>
                <td className="p-3 text-cyan-300 font-bold">{item.annualApyPercent}% APY</td>
                <td className="p-3 text-slate-300">${item.accruedYieldUsd.toFixed(2)} USD</td>
                <td className="p-3 font-semibold text-emerald-400">${item.claimableYieldUsd.toFixed(2)} USD</td>
                <td className="p-3 text-right">
                  <Button variant="outline" className="text-[10px] py-1 px-2.5">Unstake</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
