'use client';

import React from 'react';
import { PaymentMethodType } from '../domain';

export interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
}

export function PaymentMethodSelector({ selectedMethod, onSelectMethod }: PaymentMethodSelectorProps) {
  const options: { type: PaymentMethodType; label: string; description: string }[] = [
    { type: 'USDC', label: 'USDC (Solana)', description: 'Pago instantáneo con Web3 wallet' },
    { type: 'SOL', label: 'SOL (Solana)', description: 'Transacción directa on-chain' },
    { type: 'FIAT_CARD', label: 'Tarjeta de Crédito / Débito', description: 'Pago Fiat vía WorkOS / Stripe' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
      {options.map((opt) => (
        <button
          key={opt.type}
          type="button"
          onClick={() => onSelectMethod(opt.type)}
          className={`p-4 rounded-xl border text-left transition-colors ${
            selectedMethod === opt.type
              ? 'border-emerald-500 bg-emerald-950/20 text-slate-100'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
          }`}
        >
          <h5 className="font-semibold text-sm text-slate-200">{opt.label}</h5>
          <p className="text-xs text-slate-400 mt-1">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}
