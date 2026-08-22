/**
 * =========================================================================================
 * Layer 4: Infrastructure Layer — Project Config Notary Event Indexer
 * Description: Listens to on-chain ProjectDatesUpdated events from Solana Devnet and
 *              synchronizes the Postgres read-model cache replica.
 * Security Invariants:
 * - On-chain PDA is the canonical authoritative truth.
 * - Postgres acts strictly as an informative read replica.
 * - Invariant: Read-model records observed_at, slot, signature, and version.
 * =========================================================================================
 */

export interface OnChainProjectDatesUpdatedEvent {
  collectionAddress: string;
  authorityVault: string;
  oldStartAt: bigint;
  oldEndAt: bigint;
  newStartAt: bigint;
  newEndAt: bigint;
  version: number;
  signature: string;
  slot: number;
  timestamp: number;
}

export interface ProjectConfigReadModelRecord {
  collectionAddress: string;
  authorityVault: string;
  startAtIso: string;
  endAtIso: string;
  version: number;
  syncStatus: "SYNCHRONIZED" | "STALE";
  lastConfirmedSignature: string;
  lastConfirmedSlot: number;
  lastObservedAt: string;
}

/**
 * Projects on-chain notary event into a synchronized read-model cache record.
 * What: Converts on-chain epoch timestamps to ISO strings and updates read-model metadata.
 * How: Validates slot and signature presence, maps bigint Unix seconds to ISO dates, sets SYNCHRONIZED status.
 */
export function projectOnChainDatesUpdatedEventToReadModel(
  event: OnChainProjectDatesUpdatedEvent
): ProjectConfigReadModelRecord {
  if (!event.signature || event.slot <= 0) {
    throw new Error(
      "ERR_INVALID_EVENT_PROOF: On-chain event must include a valid transaction signature and slot number."
    );
  }

  const startMs = Number(event.newStartAt) * 1000;
  const endMs = Number(event.newEndAt) * 1000;

  return {
    collectionAddress: event.collectionAddress,
    authorityVault: event.authorityVault,
    startAtIso: new Date(startMs).toISOString(),
    endAtIso: new Date(endMs).toISOString(),
    version: event.version,
    syncStatus: "SYNCHRONIZED",
    lastConfirmedSignature: event.signature,
    lastConfirmedSlot: event.slot,
    lastObservedAt: new Date(event.timestamp * 1000).toISOString()
  };
}
