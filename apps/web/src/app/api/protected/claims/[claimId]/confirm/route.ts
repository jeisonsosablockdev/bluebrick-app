/**
 * SPEC-S04-B (EPIC-014): Confirm Claim Quote API Route
 *
 * POST /api/protected/claims/[claimId]/confirm
 *
 * Confirms a claim quote within its 48-hour TTL window and transitions status
 * to approved_for_dispersion.
 */

import { type NextRequest, NextResponse } from "next/server";

import { confirmClaimQuote, ClaimFlowError } from "@/features/staking-distribution/application/claim-flow";
import { resolveAppAuthContext } from "@/lib/app-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ claimId: string }> }
): Promise<NextResponse> {
  const auth = await resolveAppAuthContext();
  if (!auth.walletAuthenticated || !auth.walletPublicKey) {
    return NextResponse.json({ error: "Wallet authentication required." }, { status: 401 });
  }

  const { claimId } = await context.params;

  try {
    const claim = await confirmClaimQuote({
      claimId,
      walletPublicKey: auth.walletPublicKey
    });

    return NextResponse.json(
      {
        claim: {
          id: claim.id,
          runId: claim.runId,
          walletPublicKey: claim.walletPublicKey,
          netAmountMinor: claim.netAmountMinor.toString(),
          status: claim.status,
          confirmedAt: claim.confirmedAt
        }
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof ClaimFlowError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unexpected claim confirm error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
