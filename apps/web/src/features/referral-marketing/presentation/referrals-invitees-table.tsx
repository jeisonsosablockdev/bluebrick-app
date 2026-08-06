'use client';

import React from 'react';
import { InviteeEntity } from '../domain';
import { Card } from '../../shared/ui';

export interface ReferralsInviteesTableProps {
  invitees: InviteeEntity[];
}

export function ReferralsInviteesTable({ invitees }: ReferralsInviteesTableProps) {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-bold text-slate-100">Tus Invitados Registrados</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Usuario / Wallet</th>
              <th className="p-3">Fecha de Ingreso</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Comisión Ganada</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {invitees.map((item) => (
              <tr key={item.id} className="hover:bg-slate-900/40">
                <td className="p-3 font-mono">{item.maskedWalletOrEmail}</td>
                <td className="p-3 text-slate-400">{item.joinedAt}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    item.status === 'QUALIFIED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {item.status === 'QUALIFIED' ? 'Calificado' : 'Pendiente Inversión'}
                  </span>
                </td>
                <td className="p-3 text-right font-bold text-emerald-400">${item.commissionEarnedUsd.toFixed(2)} USD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
