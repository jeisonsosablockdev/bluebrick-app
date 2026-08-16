import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

import { getRequestRole } from "@/lib/auth-session";
import {
  isCoreCandyMachineAdminInputError,
  isCoreCandyMachineSubmitRecoverableError,
  submitCoreCandyMachineSignedTransactions,
  type SubmitSignedCandyMachineTransactionsInput
} from "@/features/nft-minting/application/core-candy-machine-admin";

type SubmitRequestBody = Partial<Omit<SubmitSignedCandyMachineTransactionsInput, "expectedPayerPublicKey">>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as SubmitRequestBody | null;

  if (!body || !Array.isArray(body.signedTransactions)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const submitted = await submitCoreCandyMachineSignedTransactions({
      expectedPayerPublicKey: requestRole.pubkey,
      deployId: body.deployId,
      signedTransactions: body.signedTransactions
    });

    return NextResponse.json({
      submittedAt: new Date().toISOString(),
      transactions: submitted
    });
  } catch (error) {
    if (isCoreCandyMachineAdminInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (isCoreCandyMachineSubmitRecoverableError(error)) {
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
      : "Could not submit Core Candy Machine transactions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
