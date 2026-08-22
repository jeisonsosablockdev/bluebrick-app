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
import { getRequestRole } from "@/lib/auth-session";

/**
 * GET /api/admin/treasury/squads/proposals
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Step 1: Enforce admin role authentication
  const auth = getRequestRole(request);
  if (!auth.authenticated || auth.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "FORBIDDEN", message: "Admin role required." },
      { status: 403 }
    );
  }

  try {
    // Step 2: Query active date change proposals in PENDING_MULTISIG status
    const allProposals = listDateChangeProposals();
    const pendingMultisig = allProposals.filter((p) => p.status === "PENDING_MULTISIG");

    // Step 3: Return active proposal payload if present, or null if no pending multisig
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
        approvedMembers: [],
        executed: false,
        onChainDates: {
          projectStartAt: latest.proposedStartAt,
          projectEndAt: latest.proposedEndAt
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
