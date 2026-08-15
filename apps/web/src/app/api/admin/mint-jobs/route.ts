import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { createOrGetMintJob } from "@/lib/mint-jobs/repository";

type CreateMintJobBody = {
  emissionId?: unknown;
  totalItems?: unknown;
  idempotencyKey?: unknown;
};

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as CreateMintJobBody | null;

  if (!body || typeof body.emissionId !== "string") {
    return badRequest("emissionId is required.");
  }

  if (typeof body.totalItems !== "number" || !Number.isInteger(body.totalItems) || body.totalItems <= 0) {
    return badRequest("totalItems must be a positive integer.");
  }

  const emissionId = body.emissionId.trim();

  if (!emissionId) {
    return badRequest("emissionId is required.");
  }

  const idempotencyKey = typeof body.idempotencyKey === "string" && body.idempotencyKey.trim().length > 0
    ? body.idempotencyKey.trim()
    : `emission:${emissionId}`;

  try {
    const result = await createOrGetMintJob({
      emissionId,
      totalItems: body.totalItems,
      idempotencyKey
    });

    return NextResponse.json(
      { job: result.job, inserted: result.inserted },
      { status: result.inserted ? 201 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create mint job.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
