import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  isMetaplexCoreAdminInputError,
  submitMetaplexCoreTransactions,
  type SubmitSignedTransactionsInput
} from "@/lib/metaplex-core-admin";

type SubmitRequestBody = Partial<SubmitSignedTransactionsInput>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as SubmitRequestBody | null;

  if (!body || !Array.isArray(body.signedTransactions)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const transactions = await submitMetaplexCoreTransactions({
      signedTransactions: body.signedTransactions
    });

    return NextResponse.json({
      submittedAt: new Date().toISOString(),
      transactions
    });
  } catch (error) {
    if (isMetaplexCoreAdminInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not submit signed transactions." }, { status: 500 });
  }
}
