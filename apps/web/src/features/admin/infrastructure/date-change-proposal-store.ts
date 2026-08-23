/**
 * =========================================================================================
 * Layer 4: Infrastructure Layer — Date Change Proposal Audit Store
 * Module: date-change-proposal-store
 *
 * Description:
 * Global store persisting PENDING_MULTISIG date change proposals for collections,
 * backed by disk storage to survive Next.js dev server hot-reloads and process restarts.
 * =========================================================================================
 */

import fs from "node:fs";
import path from "node:path";

import type { PendingDateProposal } from "@/features/admin/presentation/admin-collection-notary-dates-panel";

// Storage file location inside .cache to survive worker restarts
const STORAGE_DIR = path.resolve(process.cwd(), "apps/web/.cache");
const STORAGE_FILE = path.join(STORAGE_DIR, "date-change-proposals.json");

// Global singleton map attached to globalThis
const globalForProposals = globalThis as unknown as {
  __dateChangeProposalStore?: Map<string, PendingDateProposal>;
};

const proposalStore =
  globalForProposals.__dateChangeProposalStore ??
  (globalForProposals.__dateChangeProposalStore = new Map<string, PendingDateProposal>());

/**
 * Loads proposals from disk storage into in-memory store.
 */
function loadFromDisk(): void {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
      const list: PendingDateProposal[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (item?.collectionId) {
            proposalStore.set(item.collectionId.toLowerCase(), item);
          }
        }
      }
    }
  } catch {
    // Ignore file read error on startup
  }
}

/**
 * Saves current in-memory store to disk.
 */
function saveToDisk(): void {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    const list = Array.from(proposalStore.values());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch {
    // Ignore file write errors gracefully
  }
}

// Initial load
loadFromDisk();

/**
 * Saves or updates an active date change proposal for a collection.
 */
export function saveDateChangeProposal(proposal: PendingDateProposal): void {
  proposalStore.set(proposal.collectionId.toLowerCase(), proposal);
  saveToDisk();
}

/**
 * Retrieves the latest date change proposal for a collection ID or collection address.
 */
export function getDateChangeProposal(collectionIdOrAddress: string): PendingDateProposal | null {
  if (!collectionIdOrAddress) return null;
  const key = collectionIdOrAddress.toLowerCase();
  let found = proposalStore.get(key) ?? null;
  if (!found) {
    loadFromDisk();
    found = proposalStore.get(key) ?? null;
  }
  return found;
}

/**
 * Lists all active date change proposals.
 */
export function listDateChangeProposals(): PendingDateProposal[] {
  if (proposalStore.size === 0) {
    loadFromDisk();
  }
  return Array.from(proposalStore.values());
}

/**
 * Deletes a date change proposal for a collection ID or collection address.
 */
export function deleteDateChangeProposal(collectionIdOrAddress: string): boolean {
  if (!collectionIdOrAddress) return false;
  const key = collectionIdOrAddress.toLowerCase();
  const deleted = proposalStore.delete(key);
  saveToDisk();
  return deleted;
}

/**
 * Clears all stored date change proposals.
 */
export function clearDateChangeProposals(): void {
  proposalStore.clear();
  saveToDisk();
}

