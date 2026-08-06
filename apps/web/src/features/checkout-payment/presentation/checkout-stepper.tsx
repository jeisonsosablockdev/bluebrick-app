'use client';

import React, { useState } from 'react';
import { PaymentMethodType, PaymentOrderEntity } from '../domain';
import { PaymentMethodSelector } from './payment-method-selector';
import { processSolanaPaymentAction } from '../application';
import { Card, Button } from '../../shared/ui';

export interface CheckoutStepperProps {
  propertyTitle: string;
  pricePerTokenUsd: number;
}

export function CheckoutStepper({ propertyTitle, pricePerTokenUsd }: CheckoutStepperProps) {
  const [tokenCount, setTokenCount] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('USDC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<PaymentOrderEntity | null>(null);

  const totalUsd = tokenCount * pricePerTokenUsd;

  async function handleConfirmPurchase() {
    setIsProcessing(true);
    const order: PaymentOrderEntity = {
      orderId: `ord_${Date.now()}`,
      propertyId: 'prop-01',
      propertyTitle,
      tokenCount,
      pricePerTokenUsd,
      totalUsd,
      paymentMethod: selectedMethod,
      status: 'PENDING',
    };

    const confirmed = await processSolanaPaymentAction(order);
    setCompletedOrder(confirmed);
    setIsProcessing(false);
  }

  if (completedOrder) {
    return (
      <Card title="¡Compra Confirmada On-Chain!" className="border-emerald-500/50 bg-emerald-950/10 text-center py-8">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Has adquirido exitosamente <strong>{completedOrder.tokenCount} tokens</strong> de {completedOrder.propertyTitle}.
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 break-all">
            Firma Devnet: {completedOrder.transactionSignature}
          </div>
          <Button variant="primary" onClick={() => setCompletedOrder(null)}>Realizar Otra Inversión</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Checkout: ${propertyTitle}`} className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Cantidad de Tokens</label>
          <input
            type="number"
            min={1}
            value={tokenCount}
            onChange={(e) => setTokenCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-sm"
          />
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total a Invertir</p>
          <p className="text-2xl font-extrabold text-emerald-400">${totalUsd.toLocaleString()} USD</p>
        </div>
      </div>

      <PaymentMethodSelector selectedMethod={selectedMethod} onSelectMethod={setSelectedMethod} />

      <Button
        variant="primary"
        className="w-full py-3 font-semibold text-sm"
        disabled={isProcessing}
        onClick={handleConfirmPurchase}
      >
        {isProcessing ? 'Procesando Transacción en Devnet...' : `Confirmar Inversión por $${totalUsd.toLocaleString()} USD`}
      </Button>
    </Card>
  );
}
