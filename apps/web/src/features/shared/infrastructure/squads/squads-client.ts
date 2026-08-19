import { SquadsMultisigVault, SquadsProposalTransaction } from './types';

/**
 * Squads v4 Multisig SDK Adapter for Solana Devnet Treasury Management
 */

export function getSquadsProgramId(): string {
  return process.env.NEXT_PUBLIC_SQUADS_PROGRAM_ID || 'SQDS426qUB5hZahVkWgwySsLqyZaKnpBxZBP5tWYW45';
}

export async function fetchMultisigVaultInfo(multisigPda: string): Promise<SquadsMultisigVault | null> {
  if (!multisigPda) return null;
  return {
    multisigPda,
    createKey: 'create_key_devnet_placeholder',
    threshold: 2,
    members: [],
    treasuryBalanceLamports: '0',
  };
}

export async function createMultisigDistributionProposal(
  multisigPda: string,
  _targetLamports: string
): Promise<SquadsProposalTransaction> {
  return {
    transactionIndex: 1,
    multisigPda,
    creator: 'admin_devnet_key',
    status: 'Active',
  };
}
