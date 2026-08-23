/**
 * =========================================================================================
 * Layer 2: Application / API Route — Project Date Change Request
 * Endpoint: POST /api/admin/collections/[id]/date-change-request
 * 
 * Description: Registers an auditable date change proposal with status PENDING_MULTISIG.
 * Security Invariants:
 * - Requires ADMIN role.
 * - Does NOT modify collection dates directly in Postgres.
 * - Enforces proposedStartAt <= proposedEndAt.
 * =========================================================================================
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { getDateChangeProposal, saveDateChangeProposal } from "@/features/admin/infrastructure/date-change-proposal-store";

const dateChangeRequestSchema = z.object({
  proposedStartAt: z.string().datetime({ message: "proposedStartAt must be a valid ISO datetime" }),
  proposedEndAt: z.string().datetime({ message: "proposedEndAt must be a valid ISO datetime" }),
  justification: z.string().trim().min(5, { message: "Justification must be at least 5 characters" }),
  requesterWallet: z.string().optional()
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const collectionId = params.id;

    if (!collectionId) {
      return NextResponse.json(
        { ok: false, error: "ERR_COLLECTION_ID_REQUIRED", message: "Collection ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = dateChangeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "ERR_INVALID_REQUEST_BODY",
          message: parsed.error.issues[0]?.message || "Invalid request payload"
        },
        { status: 400 }
      );
    }

    const { proposedStartAt, proposedEndAt, justification, requesterWallet } = parsed.data;

    const startMs = Date.parse(proposedStartAt);
    const endMs = Date.parse(proposedEndAt);

    if (endMs < startMs) {
      return NextResponse.json(
        {
          ok: false,
          error: "ERR_INVALID_DATE_RANGE",
          message: "proposedEndAt cannot be earlier than proposedStartAt."
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const requestId = `dcr_${Date.now()}`;

    const proposal = {
      requestId,
      collectionId,
      status: "PENDING_MULTISIG" as const,
      proposedStartAt,
      proposedEndAt,
      justification,
      createdAt: now,
      requesterWallet: requesterWallet ?? "Comité",
      feeUsdc: "0.10"
    };

    // Step 2: Persist proposal to transitory UI read cache
    saveDateChangeProposal(proposal);

    // Step 2: Return audit record intent with status PENDING_MULTISIG
    return NextResponse.json({
      ok: true,
      data: proposal
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { ok: false, error: "ERR_INTERNAL_SERVER_ERROR", message },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const collectionId = params.id;

    if (!collectionId) {
      return NextResponse.json(
        { ok: false, error: "ERR_COLLECTION_ID_REQUIRED", message: "Collection ID is required." },
        { status: 400 }
      );
    }

    const pending = getDateChangeProposal(collectionId);

    return NextResponse.json({
      ok: true,
      collectionId,
      data: pending
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { ok: false, error: "ERR_INTERNAL_SERVER_ERROR", message },
      { status: 500 }
    );
  }
}
