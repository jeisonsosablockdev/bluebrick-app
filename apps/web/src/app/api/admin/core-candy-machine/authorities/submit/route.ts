import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  isCoreAuthorityLifecycleInputError,
  isCoreAuthorityLifecycleSubmitRecoverableError,
  submitAuthorityLifecycleSignedTransactions,
  type SubmitAuthorityLifecycleSignedTransactionsInput
} from "@/features/asset-freeze-control/application/core-authority-lifecycle";

type SubmitAuthorityRequestBody = Partial<Omit<SubmitAuthorityLifecycleSignedTransactionsInput, "expectedPayerPublicKey">>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as SubmitAuthorityRequestBody | null;

  if (!body || typeof body !== "object" || !Array.isArray(body.signedTransactions)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const submitted = await submitAuthorityLifecycleSignedTransactions({
      expectedPayerPublicKey: requestRole.pubkey,
      operationId: body.operationId ?? "",
      signedTransactions: body.signedTransactions
    });

    return NextResponse.json({
      submittedAt: new Date().toISOString(),
      operation: submitted
    });
  } catch (error) {
    if (isCoreAuthorityLifecycleInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (isCoreAuthorityLifecycleSubmitRecoverableError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          recoverable: true
        },
        { status: error.status }
      );
    }

    const message = error instanceof Error && error.message
      ? error.message
      : "Could not submit authority lifecycle operation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
