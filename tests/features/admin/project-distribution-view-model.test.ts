/**
 * =========================================================================================
 * Test Suite: Project Distribution View Model (Layer 3 — Domain Unit Tests)
 * Feature: STORY-UX-UI-FIXES / SPEC-01 (TDD - RED Phase)
 *
 * Description:
 * Tests the pure domain mapping from marketplace collection read models and on-chain
 * Notary PDA state into consolidated distribution candidate view models.
 * =========================================================================================
 */

import { describe, expect, it } from "vitest";

import {
  mapToProjectDistributionViewModel,
  type ProjectDistributionCandidate,
  type RawMarketplaceCollection
} from "@/features/admin/domain/project-distribution-view-model";
import type { ProjectConfigPdaState } from "@/lib/solana-kit/pda/project-config-reader";

describe("ProjectDistributionViewModel Domain Mapper", () => {
  const mockMarketplaceCollection: RawMarketplaceCollection = {
    entryId: "PROP-BELLA-VISTA-102",
    title: "Bella Vista Luxury Suites",
    coverImageUrl: "https://cdn.brids.io/properties/bella-vista-cover.jpg",
    collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
    candyMachineAddress: "Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuzQpF1D71K"
  };

  const mockNotaryPdaState: ProjectConfigPdaState = {
    authorityVault: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
    multisig: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
    vaultIndex: 0,
    collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
    startAtUnixSeconds: 1785542400n, // 2026-08-01T00:00:00Z
    endAtUnixSeconds: 1788220799n,   // 2026-08-31T23:59:59Z
    version: 1,
    updatedAtUnixSeconds: 1785542400n,
    bump: 254
  };

  it("maps marketplace collection and synchronized on-chain notary PDA to ready distribution model", () => {
    const result: ProjectDistributionCandidate = mapToProjectDistributionViewModel(
      mockMarketplaceCollection,
      mockNotaryPdaState,
      "SYNCHRONIZED"
    );

    expect(result.id).toBe("PROP-BELLA-VISTA-102");
    expect(result.title).toBe("Bella Vista Luxury Suites");
    expect(result.coverImageUrl).toBe("https://cdn.brids.io/properties/bella-vista-cover.jpg");
    expect(result.collectionAddress).toBe("9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz");
    expect(result.periodStartAt).toBe("2026-08-01T00:00:00.000Z");
    expect(result.periodEndAt).toBe("2026-08-31T23:59:59.000Z");
    expect(result.periodKey).toBe("2026-08");
    expect(result.notaryVersion).toBe(1);
    expect(result.syncStatus).toBe("SYNCHRONIZED");
    expect(result.isReadyForDistribution).toBe(true);
  });

  it("handles uninitialized notary PDA by providing default current month period and UNINITIALIZED status", () => {
    const result = mapToProjectDistributionViewModel(
      mockMarketplaceCollection,
      null,
      "UNINITIALIZED"
    );

    expect(result.id).toBe("PROP-BELLA-VISTA-102");
    expect(result.title).toBe("Bella Vista Luxury Suites");
    expect(result.notaryVersion).toBe(0);
    expect(result.syncStatus).toBe("UNINITIALIZED");
    expect(result.isReadyForDistribution).toBe(false);
    expect(result.periodKey).toMatch(/^\d{4}-\d{2}$/);
    expect(result.periodStartAt).toBeTruthy();
    expect(result.periodEndAt).toBeTruthy();
  });

  it("handles RPC error gracefully with RPC_ERROR status and blocked readiness", () => {
    const result = mapToProjectDistributionViewModel(
      mockMarketplaceCollection,
      null,
      "RPC_ERROR"
    );

    expect(result.syncStatus).toBe("RPC_ERROR");
    expect(result.isReadyForDistribution).toBe(false);
  });

  it("formats fallback image if coverImageUrl is missing or empty", () => {
    const emptyImageCollection = {
      ...mockMarketplaceCollection,
      coverImageUrl: ""
    };

    const result = mapToProjectDistributionViewModel(
      emptyImageCollection,
      mockNotaryPdaState,
      "SYNCHRONIZED"
    );

    expect(result.coverImageUrl).toBe("/images/placeholder-property.jpg");
  });
});
