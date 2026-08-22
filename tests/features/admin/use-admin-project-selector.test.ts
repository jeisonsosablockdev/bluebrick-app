/**
 * =========================================================================================
 * Test Suite: useAdminProjectSelector Hook (Layer 2 — Application Hook Unit Tests)
 * Feature: STORY-UX-UI-FIXES / SPEC-01
 *
 * Description:
 * Tests the application hook that queries /api/admin/collections and maps available
 * projects with their on-chain Notary PDA state for UI consumption.
 * =========================================================================================
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveAdminProjectCandidates } from "@/features/admin/application/use-admin-project-selector";
import type { RawMarketplaceCollection } from "@/features/admin/domain/project-distribution-view-model";

describe("useAdminProjectSelector Application Logic", () => {
  const mockCollections: RawMarketplaceCollection[] = [
    {
      entryId: "PROP-BELLA-VISTA-102",
      title: "Bella Vista Luxury Suites",
      coverImageUrl: "https://cdn.brids.io/bella-vista.jpg",
      collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz"
    },
    {
      entryId: "PROP-ALTOS-DEL-VALLE-201",
      title: "Altos del Valle Residencial",
      coverImageUrl: "https://cdn.brids.io/altos.jpg",
      collectionAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves project candidate items from collections list", async () => {
    // Mock RPC reader resolver returning mock PDA state
    const mockPdaResolver = vi.fn().mockImplementation(async (collectionAddress: string) => {
      if (collectionAddress === "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz") {
        return {
          state: {
            authorityVault: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
            multisig: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
            vaultIndex: 0,
            collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
            startAtUnixSeconds: 1785542400n,
            endAtUnixSeconds: 1788220799n,
            version: 1,
            updatedAtUnixSeconds: 1785542400n,
            bump: 254
          },
          syncStatus: "SYNCHRONIZED" as const
        };
      }

      return {
        state: null,
        syncStatus: "UNINITIALIZED" as const
      };
    });

    const candidates = await resolveAdminProjectCandidates(mockCollections, mockPdaResolver);

    expect(candidates).toHaveLength(2);

    const first = candidates[0];
    expect(first.id).toBe("PROP-BELLA-VISTA-102");
    expect(first.title).toBe("Bella Vista Luxury Suites");
    expect(first.syncStatus).toBe("SYNCHRONIZED");
    expect(first.isReadyForDistribution).toBe(true);
    expect(first.periodKey).toBe("2026-08");

    const second = candidates[1];
    expect(second.id).toBe("PROP-ALTOS-DEL-VALLE-201");
    expect(second.syncStatus).toBe("UNINITIALIZED");
    expect(second.isReadyForDistribution).toBe(false);
  });

  it("handles empty collections list cleanly", async () => {
    const mockPdaResolver = vi.fn();
    const candidates = await resolveAdminProjectCandidates([], mockPdaResolver);

    expect(candidates).toEqual([]);
    expect(mockPdaResolver).not.toHaveBeenCalled();
  });
});
