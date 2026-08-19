'use client';

import React, { useState } from 'react';
import { DepositFrequency, DepositScheduleEntity } from '../domain';
import { AutoReinvestToggle } from './auto-reinvest-toggle';
import { configureRecurringDepositAction } from '../application';
import { Card, Button } from '../../shared/ui';

export function RecurringScheduleConsole() {
  const [amountUsd, setAmountUsd] = useState(100);
  const [frequency, setFrequency] = useState<DepositFrequency>('MONTHLY');
  const [autoReinvest, setAutoReinvest] = useState(true);
  const [activeSchedule, setActiveSchedule] = useState<DepositScheduleEntity | null>(null);

  async function handleSaveSchedule() {
    const schedule = await configureRecurringDepositAction({
      userWalletAddress: 'SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45',
      amountUsd,
      frequency,
      autoReinvestDividends: autoReinvest,
    });
    setActiveSchedule(schedule);
  }

  return (
    <Card title="Plan de Depósitos Recurrentes & Interés Compuesto" className="space-y-6">
      {activeSchedule ? (
        <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/20 text-slate-100 space-y-2">
          <h4 className="font-bold text-emerald-400">Plan Recurrente Activo</h4>
          <p className="text-xs text-slate-300">Depósito programado de <strong>${activeSchedule.amountUsd} USD</strong> ({activeSchedule.frequency}).</p>
          <p className="text-xs text-slate-400">Próxima ejecución: {new Date(activeSchedule.nextExecutionDate).toLocaleDateString()}</p>
          <Button variant="outline" className="text-xs mt-2" onClick={() => setActiveSchedule(null)}>Editar Plan</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Monto Mensual en USD</label>
            <input
              type="number"
              min={10}
              value={amountUsd}
              onChange={(e) => setAmountUsd(parseInt(e.target.value) || 10)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-sm"
            />
          </div>

          <AutoReinvestToggle enabled={autoReinvest} onToggle={setAutoReinvest} />

          <Button variant="primary" className="w-full py-2.5 text-sm" onClick={handleSaveSchedule}>
            Activar Depósito Recurrente (${amountUsd} USD/{frequency})
          </Button>
        </div>
      )}
    </Card>
  );
}
