import { PaymentOrderEntity } from '../domain';
import { SolanaPayTransactionAdapter } from '../infrastructure';

export async function processSolanaPaymentAction(order: PaymentOrderEntity): Promise<PaymentOrderEntity> {
  const adapter = new SolanaPayTransactionAdapter();
  const { signature } = await adapter.createSolanaPayTransaction(order);

  return {
    ...order,
    status: 'CONFIRMED',
    transactionSignature: signature,
  };
}
