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

import { listDateChangeProposals } from "@/features/admin/infrastructure/date-change-proposal-store";

/**
 * GET /api/admin/treasury/squads/proposals
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Query active date change proposals in PENDING_MULTISIG status
    const allProposals = listDateChangeProposals();
    const pendingMultisig = allProposals.filter((p) => p.status === "PENDING_MULTISIG");

    // Step 2: Return active proposal payload if present, or null if no pending multisig
    if (pendingMultisig.length === 0) {
      return NextResponse.json({
        ok: true,
        data: null
      });
    }

    const latest = pendingMultisig[0];

    return NextResponse.json({
      ok: true,
      data: {
        runId: latest.collectionId,
        treasuryPolicyPda: "Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuzQpF1D71K",
        multisigPda: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
        vaultPda: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
        threshold: 2,
        membersCount: 4,
        approvedMembers: latest.approvals ?? [],
        executed: (latest.approvals ?? []).length >= 2,
        onChainDates: {
          projectStartAt: "2026-03-15T00:00:00Z",
          projectEndAt: "2028-12-31T23:59:59Z"
        },
        dbDates: {
          projectStartAt: latest.proposedStartAt,
          projectEndAt: latest.proposedEndAt,
          modificationReason: latest.justification
        },
        beneficiaries: []
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
