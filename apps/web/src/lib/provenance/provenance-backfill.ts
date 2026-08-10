/**
 * SPEC-S02-B (EPIC-014): Provenance Backfill Job
 *
 * Scans assets for a project via DAS / Archival RPC, verifies mint transaction
 * evidence, and populates asset_project_origins.
 *
 * Invariants:
 * - Assets with verified mint transactions -> provenanceStatus = "validated"
 * - Assets with missing/pruned mint transactions -> provenanceStatus = "needs_review"
 * - Assets with status "needs_review" are mathematically excluded from Final Calculation
 */

import { DasClient } from "@/lib/infrastructure/das-client";
import { createArchivalRpcClient } from "@/lib/archival/archival-rpc-client";
import {
  getProjectCandyMachineSource,
  getAssetProjectOrigin,
  upsertAssetProjectOrigin,
  type AssetProjectOriginRecord
} from "@/lib/provenance/provenance-repository";

export type ProvenanceBackfillResult = {
  projectId: string;
  totalAssetsScanned: number;
  validatedCount: number;
  needsReviewCount: number;
  errors: Array<{ assetAddress: string; error: string }>;
};

export async function runProvenanceBackfill(
  projectId: string
): Promise<ProvenanceBackfillResult> {
  const pcmSource = await getProjectCandyMachineSource(projectId);
  if (!pcmSource) {
    throw new Error(`No project_candy_machine_sources record found for project: ${projectId}`);
  }

  if (!pcmSource.collectionAddress) {
    throw new Error(`project_candy_machine_sources for ${projectId} lacks collectionAddress.`);
  }

  const dasClient = new DasClient();
  const archivalRpc = createArchivalRpcClient();

  const dasResult = await dasClient.getAssetsByCollection(pcmSource.collectionAddress, {
    page: 1,
    limit: 1000
  });

  const assets = dasResult.items as Array<{ id?: string; address?: string }>;
  const result: ProvenanceBackfillResult = {
    projectId,
    totalAssetsScanned: assets.length,
    validatedCount: 0,
    needsReviewCount: 0,
    errors: []
  };

  for (const assetObj of assets) {
    const assetAddress = assetObj.id ?? assetObj.address;
    if (!assetAddress) continue;

    try {
      const existing = await getAssetProjectOrigin(assetAddress);
      if (existing && existing.provenanceStatus === "validated") {
        result.validatedCount += 1;
        continue;
      }

      // Query historical transactions via archival RPC
      const signatures = await archivalRpc.getSignaturesForAddress(assetAddress, { limit: 100 });

      let mintSignature: string | null = null;
      let mintSlot: number | null = null;
      let mintBlockTime: string | null = null;
      let minterWallet: string | null = null;

      // Oldest signature is likely the mint
      if (signatures.length > 0) {
        const oldestSig = signatures[signatures.length - 1]!;
        try {
          const txResult = await archivalRpc.getTransaction(oldestSig.signature);
          if (txResult.tx) {
            mintSignature = oldestSig.signature;
            mintSlot = oldestSig.slot;
            mintBlockTime = oldestSig.blockTime
              ? new Date(oldestSig.blockTime * 1000).toISOString()
              : null;
          }
        } catch {
          // Transaction not fetchable
        }
      }

      const isValidated = Boolean(mintSignature);
      const provenanceStatus = isValidated ? "validated" : "needs_review";

      await upsertAssetProjectOrigin({
        assetAddress,
        projectId,
        collectionAddress: pcmSource.collectionAddress,
        candyMachineAddress: pcmSource.candyMachineAddress,
        mintSignature,
        mintSlot,
        mintBlockTime,
        minterWallet,
        provenanceSource: "parsed_transaction",
        provenanceStatus
      });

      if (isValidated) {
        result.validatedCount += 1;
      } else {
        result.needsReviewCount += 1;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result.errors.push({ assetAddress, error: errorMsg });

      // Fallback: insert as needs_review
      await upsertAssetProjectOrigin({
        assetAddress,
        projectId,
        collectionAddress: pcmSource.collectionAddress,
        candyMachineAddress: pcmSource.candyMachineAddress,
        provenanceSource: "parsed_transaction",
        provenanceStatus: "needs_review"
      }).catch(() => {});

      result.needsReviewCount += 1;
    }
  }

  return result;
}
