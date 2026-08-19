export type PaymentMethodType = 'SOL' | 'USDC' | 'FIAT_CARD' | 'BANK_TRANSFER';

export interface PaymentOrderEntity {
  orderId: string;
  propertyId: string;
  propertyTitle: string;
  tokenCount: number;
  pricePerTokenUsd: number;
  totalUsd: number;
  paymentMethod: PaymentMethodType;
  buyerWalletAddress?: string;
  status: 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'FAILED';
  transactionSignature?: string;
}
