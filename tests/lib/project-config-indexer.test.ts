import { describe, it, expect } from "vitest";

import {
  projectOnChainDatesUpdatedEventToReadModel,
  type OnChainProjectDatesUpdatedEvent
} from "@/lib/solana-kit/indexers/project-config-indexer";

/**
 * =========================================================================================
 * 🧪 SPEC-05 (STORY-015-07): PROJECT CONFIG NOTARY EVENT INDEXER TESTS
 * =========================================================================================
 * 
 * Verifies read-model synchronization invariants:
 * 1. Converts on-chain epoch timestamps to ISO dates.
 * 2. Attaches slot, signature, version, and SYNCHRONIZED status to read replica.
 * 3. Rejects events without valid signature or slot.
 */

describe("SPEC-05 (STORY-015-07): Project Config Notary Event Indexer", () => {
  const sampleEvent: OnChainProjectDatesUpdatedEvent = {
    collectionAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    authorityVault: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
    oldStartAt: 1755800000n,
    oldEndAt: 1755900000n,
    newStartAt: 1755810000n,
    newEndAt: 1755920000n,
    version: 2,
    signature: "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYj7WQbmpRpoC8PP8e4p9M4e6T3kRvfL8hVqC3GgQoYv9aHqZbS4Yp",
    slot: 284910283,
    timestamp: 1755850000
  };

  it("should project on-chain event to synchronized read-model record", () => {
    const record = projectOnChainDatesUpdatedEventToReadModel(sampleEvent);

    expect(record.syncStatus).toBe("SYNCHRONIZED");
    expect(record.version).toBe(2);
    expect(record.collectionAddress).toBe(sampleEvent.collectionAddress);
    expect(record.authorityVault).toBe(sampleEvent.authorityVault);
    expect(record.startAtIso).toBe(new Date(1755810000 * 1000).toISOString());
    expect(record.endAtIso).toBe(new Date(1755920000 * 1000).toISOString());
    expect(record.lastConfirmedSignature).toBe(sampleEvent.signature);
    expect(record.lastConfirmedSlot).toBe(284910283);
  });

  it("should reject events without signature or valid slot", () => {
    expect(() =>
      projectOnChainDatesUpdatedEventToReadModel({
        ...sampleEvent,
        signature: ""
      })
    ).toThrowError("ERR_INVALID_EVENT_PROOF");

    expect(() =>
      projectOnChainDatesUpdatedEventToReadModel({
        ...sampleEvent,
        slot: 0
      })
    ).toThrowError("ERR_INVALID_EVENT_PROOF");
  });
});
