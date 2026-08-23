/**
 * =========================================================================================
 * Layer 2: Application Layer — Squads Multisig Proposals Route
 * Route: GET /api/admin/treasury/squads/proposals
 *
 * Description:
 * Returns the current active Squads v4 treasury payout proposals and associated distribution
 * run state. Queries the date change proposal audit records and live settlement batches.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";

import {
  clearDateChangeProposals,
  deleteDateChangeProposal,
  getDateChangeProposal,
  listDateChangeProposals
} from "@/features/admin/infrastructure/date-change-proposal-store";
import {
  fetchSquadsNativeProposals,
  fetchSquadsMultisigState,
  SQUADS_DEVNET_MULTISIG_PDA,
  SQUADS_DEVNET_VAULT_PDA
} from "@/lib/solana-kit/compat/squads-v4-client";
import { getSolscanTransactionUrl } from "@/lib/infrastructure/solana";

/**
 * GET /api/admin/treasury/squads/proposals
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const runIdParam = url.searchParams.get("runId");

    // Step 1: Fetch live on-chain proposals from Squads v4 Devnet
    let nativeProposals: Awaited<ReturnType<typeof fetchSquadsNativeProposals>> = [];
    try {
      nativeProposals = await fetchSquadsNativeProposals(SQUADS_DEVNET_MULTISIG_PDA);
    } catch (e) {
      console.warn("Could not fetch native squads proposals from RPC:", e);
    }

    const indexParam = url.searchParams.get("index") || url.searchParams.get("transactionIndex");

    // Select requested proposal, or prioritize active/approved proposal, or fallback to latest
    let selectedNative: (typeof nativeProposals)[0] | null = null;
    if (indexParam) {
      selectedNative = nativeProposals.find((p) => p.transactionIndex === indexParam) ?? null;
    }
    if (!selectedNative && nativeProposals.length > 0) {
      const activeOrApproved = nativeProposals.find((p) => p.status === "Active" || p.status === "Approved");
      selectedNative = activeOrApproved || nativeProposals[0];
    }

    let latestStored = runIdParam ? getDateChangeProposal(runIdParam) : null;
    if (!latestStored) {
      const allProposals = listDateChangeProposals();
      const pendingMultisig = allProposals.filter((p) => p.status === "PENDING_MULTISIG");
      latestStored = pendingMultisig.length > 0 ? pendingMultisig[pendingMultisig.length - 1] : (allProposals.length > 0 ? allProposals[allProposals.length - 1] : null);
    }

    // Step 2: Return null if neither native nor stored proposals exist
    if (!selectedNative && !latestStored) {
      return NextResponse.json({
        ok: true,
        data: null
      });
    }

    const threshold = selectedNative ? selectedNative.threshold : 2;
    const approvedMembers = selectedNative ? selectedNative.approved : (latestStored?.approvals ?? []);
    const isExecuted = selectedNative ? selectedNative.status === "Executed" : approvedMembers.length >= threshold;
    const txIndex = selectedNative ? selectedNative.transactionIndex : "1";

    return NextResponse.json({
      ok: true,
      data: {
        runId: latestStored?.collectionId || `squads_tx_${txIndex}`,
        transactionIndex: txIndex,
        proposalPda: selectedNative?.proposalPda,
        treasuryPolicyPda: "Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuzQpF1D71K",
        multisigPda: SQUADS_DEVNET_MULTISIG_PDA,
        vaultPda: SQUADS_DEVNET_VAULT_PDA,
        threshold,
        membersCount: selectedNative?.totalMembers ?? 4,
        approvedMembers,
        executed: isExecuted,
        status: selectedNative?.status || (isExecuted ? "Executed" : "Active"),
        txSignature: latestStored?.txSignature,
        solscanUrl: latestStored?.solscanUrl ?? (selectedNative?.proposalPda ? getSolscanTransactionUrl(selectedNative.proposalPda) : undefined),
        requesterWallet: latestStored?.requesterWallet ?? "Comité",
        feeUsdc: latestStored?.feeUsdc ?? "0.10",
        onChainDates: {
          projectStartAt: "2026-03-15T00:00:00Z",
          projectEndAt: "2028-12-31T23:59:59Z"
        },
        dbDates: {
          projectStartAt: latestStored?.proposedStartAt || "2026-09-01T00:00:00.000Z",
          projectEndAt: latestStored?.proposedEndAt || "2027-09-01T00:00:00.000Z",
          modificationReason: latestStored?.justification || "Actualización de fechas del proyecto inmobiliario"
        },
        beneficiaries: [],
        nativeProposals
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load squads proposals.";
    return NextResponse.json(
      { ok: false, error: "LOAD_FAILED", message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/treasury/squads/proposals
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const runId = url.searchParams.get("runId");

    if (runId) {
      deleteDateChangeProposal(runId);
    } else {
      clearDateChangeProposals();
    }

    return NextResponse.json({
      ok: true,
      message: runId ? `Propuesta ${runId} eliminada.` : "Todas las propuestas han sido eliminadas."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete squads proposal.";
    return NextResponse.json(
      { ok: false, error: "DELETE_FAILED", message },
      { status: 500 }
    );
  }
}
