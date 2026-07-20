/**
 * SPEC-S03-C (EPIC-014): Committee Review & Dispersion Approval API Route
 *
 * POST /api/admin/distribution/runs/[runId]/committee
 * Body: {
 *   action: "review" | "approve" | "reject",
 *   reason?: string,
 *   evidence?: string
 * }
 *
 * Admin route enforcing state machine transitions for committee review.
 */

import { type NextRequest, NextResponse } from "next/server";

import {
  transitionDistributionRunState,
  InvalidStateTransitionError
} from "@/lib/distribution/state-machine";
import { generateDispersionPackage } from "@/lib/distribution/committee";
import { getRequestRole } from "@/lib/auth-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> }
): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await context.params;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: "review" | "approve" | "reject";
      reason?: string;
      evidence?: string;
    };

    if (!body.action) {
      return NextResponse.json(
        { error: "action ('review' | 'approve' | 'reject') is required." },
        { status: 400 }
      );
    }

    let smAction: "SUBMIT_FOR_COMMITTEE_REVIEW" | "APPROVE_DISPERSION" | "REJECT_DISPERSION";
    if (body.action === "review") {
      smAction = "SUBMIT_FOR_COMMITTEE_REVIEW";
    } else if (body.action === "approve") {
      smAction = "APPROVE_DISPERSION";
    } else if (body.action === "reject") {
      smAction = "REJECT_DISPERSION";
    } else {
      return NextResponse.json(
        { error: "Invalid action. Allowed values: 'review', 'approve', 'reject'." },
        { status: 400 }
      );
    }

    const transition = await transitionDistributionRunState({
      runId,
      action: smAction,
      actorId: role.walletPublicKey ?? "admin",
      payload: {
        reason: body.reason ?? null,
        evidence: body.evidence ?? null
      }
    });

    const dispersionPackage = await generateDispersionPackage(runId).catch(() => null);

    return NextResponse.json(
      {
        runId,
        oldStatus: transition.oldStatus,
        newStatus: transition.newStatus,
        dispersionPackage
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof InvalidStateTransitionError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
    }

    const message = error instanceof Error ? error.message : "Unexpected committee review error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
