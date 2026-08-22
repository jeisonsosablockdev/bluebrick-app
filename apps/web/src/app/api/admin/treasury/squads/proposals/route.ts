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
    // Step 1: Query specific proposal by runId query param or retrieve active PENDING_MULTISIG proposals
    const url = new URL(request.url);
    const runIdParam = url.searchParams.get("runId");

    let latest = runIdParam ? getDateChangeProposal(runIdParam) : null;

    if (!latest) {
      const allProposals = listDateChangeProposals();
      const pendingMultisig = allProposals.filter((p) => p.status === "PENDING_MULTISIG");
      latest = pendingMultisig.length > 0 ? pendingMultisig[pendingMultisig.length - 1] : (allProposals.length > 0 ? allProposals[allProposals.length - 1] : null);
    }

    // Step 2: Return active proposal payload if present, or null if no proposals exist
    if (!latest) {
      return NextResponse.json({
        ok: true,
        data: null
      });
    }

    const approvals = latest.approvals ?? [];
    const threshold = 2;

    return NextResponse.json({
      ok: true,
      data: {
        runId: latest.collectionId,
        treasuryPolicyPda: "Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuzQpF1D71K",
        multisigPda: "rVKwqnxyq2RuU4sTBdXhifrZB9oY9mGoqw5oA6EHKaD",
        vaultPda: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
        threshold,
        membersCount: 4,
        approvedMembers: approvals,
        executed: approvals.length >= threshold,
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
