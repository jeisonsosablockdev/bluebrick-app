'use client';

import React from 'react';

export interface AutoReinvestToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function AutoReinvestToggle({ enabled, onToggle }: AutoReinvestToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
      <div>
        <h5 className="font-semibold text-sm text-slate-100">Reinversión Automática de Dividendos</h5>
        <p className="text-xs text-slate-400">Reinvierte automáticamente los rendimientos mensuales para interés compuesto.</p>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={`w-12 h-6 rounded-full transition-colors relative p-1 ${enabled ? 'bg-emerald-500' : 'bg-slate-800'}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
