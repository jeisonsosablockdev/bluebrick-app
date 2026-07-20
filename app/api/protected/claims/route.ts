/**
 * SPEC-S04-B (EPIC-014): User Claim Quote API Route
 *
 * POST /api/protected/claims
 * Body: { runId: string }
 *
 * Creates a 48-hour locked fee quote for an authenticated user's claimable yield.
 */

import { type NextRequest, NextResponse } from "next/server";

import { createClaimQuote, ClaimFlowError } from "@/lib/claims/claim-flow";
import { resolveAppAuthContext } from "@/lib/app-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await resolveAppAuthContext();
  if (!auth.authenticated || !auth.walletPublicKey) {
    return NextResponse.json({ error: "Wallet authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { runId?: string };
    const runId = body.runId?.trim();

    if (!runId) {
      return NextResponse.json({ error: "runId is required in body." }, { status: 400 });
    }

    const claim = await createClaimQuote({
      walletPublicKey: auth.walletPublicKey,
      runId
    });

    return NextResponse.json(
      {
        claim: {
          id: claim.id,
          runId: claim.runId,
          walletPublicKey: claim.walletPublicKey,
          payoutWallet: claim.payoutWallet,
          grossAmountMinor: claim.grossAmountMinor.toString(),
          feeAmountMinor: claim.feeAmountMinor.toString(),
          netAmountMinor: claim.netAmountMinor.toString(),
          status: claim.status,
          quoteExpiresAt: claim.quoteExpiresAt
        }
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof ClaimFlowError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unexpected claim error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
