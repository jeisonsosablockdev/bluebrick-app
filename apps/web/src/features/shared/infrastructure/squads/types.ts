/**
 * Squads v4 Multisig Infrastructure Types
 */

export interface SquadsMultisigVault {
  multisigPda: string;
  createKey: string;
  threshold: number;
  members: string[];
  treasuryBalanceLamports: string;
}

export interface SquadsProposalTransaction {
  transactionIndex: number;
  multisigPda: string;
  creator: string;
  status: 'Draft' | 'Active' | 'Executed' | 'Cancelled';
  executedAt?: string;
}
