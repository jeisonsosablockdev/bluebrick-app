import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  createDistributionRunDraft,
  DistributionServiceError,
  listDistributionRunsForAdmin
} from "@/lib/distributions/distribution-service";

function errorResponse(status: number, code: string, message: string, details?: Record<string, unknown>): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details: details ?? null
      }
    },
    { status }
  );
}

function jsonResponse(payload: unknown, status = 200): NextResponse {
  return new NextResponse(JSON.stringify(payload, bigintJsonReplacer), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function bigintJsonReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

function getAdminActorId(request: NextRequest): string | null {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return null;
  }

  return role.pubkey ?? "admin";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  const runs = await listDistributionRunsForAdmin();
  return jsonResponse({
    ok: true,
    data: runs
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return errorResponse(403, "FORBIDDEN", "Admin role is required.");
  }

  try {
    const body = await request.json();
    const result = await createDistributionRunDraft({
      periodKey: body.periodKey,
      collectionAddress: body.collectionAddress,
      propertyId: body.propertyId,
      periodStartAt: body.periodStartAt,
      periodEndAt: body.periodEndAt,
      policyVersion: body.policyVersion,
      tokenMint: body.tokenMint,
      totalAmountMinor: body.totalAmountMinor,
      actorId
    });

    return jsonResponse({
      ok: true,
      data: result
    });
  } catch (error) {
    if (error instanceof DistributionServiceError) {
      return errorResponse(error.status, error.code, error.message, error.details);
    }

    const message = error instanceof Error ? error.message : "Could not create distribution run.";
    return errorResponse(500, "DISTRIBUTION_RUN_CREATE_FAILED", message);
  }
}
