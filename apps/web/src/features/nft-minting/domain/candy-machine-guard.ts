export interface CandyMachineGuardConfig {
  startDate?: string;
  endDate?: string;
  solPaymentAddress?: string;
  allowListMerkleRoot?: string;
}

export function validateGuardActive(config: CandyMachineGuardConfig): boolean {
  if (!config.startDate) return true;
  return new Date() >= new Date(config.startDate);
}
