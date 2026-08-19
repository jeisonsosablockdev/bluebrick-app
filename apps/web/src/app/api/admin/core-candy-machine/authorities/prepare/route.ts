import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  isCoreAuthorityLifecycleInputError,
  prepareAuthorityLifecycleOperation,
  type PrepareAuthorityLifecycleInput
} from "@/features/asset-freeze-control/application/core-authority-lifecycle";

type PrepareAuthorityRequestBody = Partial<Omit<PrepareAuthorityLifecycleInput, "payerPublicKey">>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as PrepareAuthorityRequestBody | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const prepared = await prepareAuthorityLifecycleOperation({
      payerPublicKey: requestRole.pubkey,
      collectionAddress: body.collectionAddress ?? "",
      role: body.role as PrepareAuthorityLifecycleInput["role"],
      operation: body.operation as PrepareAuthorityLifecycleInput["operation"],
      newAuthority: body.newAuthority,
      multisig: body.multisig as PrepareAuthorityLifecycleInput["multisig"]
    });

    return NextResponse.json(prepared);
  } catch (error) {
    if (isCoreAuthorityLifecycleInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error && error.message
      ? error.message
      : "Could not prepare authority lifecycle operation.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
