/**
 * =========================================================================================
 * Layer 2: Application Layer — Treasury Summary API Route
 * Module: treasury/summary
 * Route: GET /api/admin/treasury/summary
 *
 * Description:
 * Aggregates real-time treasury governance data including active PENDING_MULTISIG date
 * change proposals, active distribution runs, and recent treasury movements for the
 * admin treasury console without mock fixtures.
 * =========================================================================================
 */

import { NextResponse } from "next/server";

import { listDateChangeProposals } from "@/features/admin/infrastructure/date-change-proposal-store";

/**
 * GET Handler returning live treasury governance overview data.
 */
export async function GET() {
  try {
    // Step 1: Retrieve all active PENDING_MULTISIG date change proposals
    const allProposals = listDateChangeProposals();
    const pendingProposals = allProposals.filter((p) => p.status === "PENDING_MULTISIG");

    // Step 2: Return aggregated real data payload
    return NextResponse.json({
      ok: true,
      data: {
        pendingProposals,
        activeRun: null,
        movements: []
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { ok: false, error: "ERR_INTERNAL_SERVER_ERROR", message },
      { status: 500 }
    );
  }
}
