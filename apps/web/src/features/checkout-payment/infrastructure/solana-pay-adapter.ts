import { PaymentOrderEntity } from '../domain';

export class SolanaPayTransactionAdapter {
  async createSolanaPayTransaction(order: PaymentOrderEntity): Promise<{ signature: string }> {
    const dummySig = `sim_sig_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`;
    return { signature: dummySig };
  }
}
