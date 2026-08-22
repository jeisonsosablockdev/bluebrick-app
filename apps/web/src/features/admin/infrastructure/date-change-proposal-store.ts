/**
 * =========================================================================================
 * Layer 4: Infrastructure Layer — Date Change Proposal Audit Store
 * Module: date-change-proposal-store
 *
 * Description:
 * In-process store persisting PENDING_MULTISIG date change proposals for collections,
 * ensuring audit records and pending status persist across page reloads and admin sessions.
 * =========================================================================================
 */

import type { PendingDateProposal } from "@/features/admin/presentation/admin-collection-notary-dates-panel";

// Global singleton map to preserve state across Next.js API route invocations in development/runtime
const globalProposalStore = new Map<string, PendingDateProposal>();

/**
 * Saves or updates an active date change proposal for a collection.
 */
export function saveDateChangeProposal(proposal: PendingDateProposal): void {
  // Step 1: Index by collectionId
  globalProposalStore.set(proposal.collectionId.toLowerCase(), proposal);
}

/**
 * Retrieves the latest date change proposal for a collection ID or collection address.
 */
export function getDateChangeProposal(collectionIdOrAddress: string): PendingDateProposal | null {
  if (!collectionIdOrAddress) return null;
  const key = collectionIdOrAddress.toLowerCase();
  return globalProposalStore.get(key) ?? null;
}

/**
 * Lists all active date change proposals.
 */
export function listDateChangeProposals(): PendingDateProposal[] {
  return Array.from(globalProposalStore.values());
}
