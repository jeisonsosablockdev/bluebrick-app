export type DepositFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface DepositScheduleEntity {
  id: string;
  userWalletAddress: string;
  amountUsd: number;
  frequency: DepositFrequency;
  autoReinvestDividends: boolean;
  nextExecutionDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
}
