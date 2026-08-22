/**
 * =========================================================================================
 * Layer 4: Infrastructure Layer — Date Change Proposal Audit Store
 * Module: date-change-proposal-store
 *
 * Description:
 * Global store persisting PENDING_MULTISIG date change proposals for collections,
 * ensuring audit records and pending status persist across page reloads and Next.js sessions.
 * =========================================================================================
 */

import type { PendingDateProposal } from "@/features/admin/presentation/admin-collection-notary-dates-panel";

// Global singleton map attached to globalThis to survive Next.js dev server hot-reloads
const globalForProposals = globalThis as unknown as {
  __dateChangeProposalStore?: Map<string, PendingDateProposal>;
};

const proposalStore =
  globalForProposals.__dateChangeProposalStore ??
  (globalForProposals.__dateChangeProposalStore = new Map<string, PendingDateProposal>());

/**
 * Saves or updates an active date change proposal for a collection.
 */
export function saveDateChangeProposal(proposal: PendingDateProposal): void {
  // Step 1: Index by collectionId
  proposalStore.set(proposal.collectionId.toLowerCase(), proposal);
}

/**
 * Retrieves the latest date change proposal for a collection ID or collection address.
 */
export function getDateChangeProposal(collectionIdOrAddress: string): PendingDateProposal | null {
  if (!collectionIdOrAddress) return null;
  const key = collectionIdOrAddress.toLowerCase();
  return proposalStore.get(key) ?? null;
}

/**
 * Lists all active date change proposals.
 */
export function listDateChangeProposals(): PendingDateProposal[] {
  return Array.from(proposalStore.values());
}

/**
 * Deletes a date change proposal for a collection ID or collection address.
 */
export function deleteDateChangeProposal(collectionIdOrAddress: string): boolean {
  if (!collectionIdOrAddress) return false;
  const key = collectionIdOrAddress.toLowerCase();
  return proposalStore.delete(key);
}

/**
 * Clears all stored date change proposals.
 */
export function clearDateChangeProposals(): void {
  proposalStore.clear();
}
