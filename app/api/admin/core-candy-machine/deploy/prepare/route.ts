import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  isCoreCandyMachineAdminInputError,
  prepareCoreCandyMachineDeploy,
  type PrepareCandyMachineDeployInput
} from "@/lib/core-candy-machine-admin";

type PrepareDeployRequestBody = Partial<Omit<PrepareCandyMachineDeployInput, "payerPublicKey">>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as PrepareDeployRequestBody | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const prepared = await prepareCoreCandyMachineDeploy({
      payerPublicKey: requestRole.pubkey,
      collectionName: body.collectionName ?? "",
      collectionUri: body.collectionUri ?? "",
      assetNamePrefix: body.assetNamePrefix ?? "",
      assetUri: body.assetUri ?? "",
      quantity: typeof body.quantity === "number" ? body.quantity : 0,
      startDate: body.startDate ?? "",
      startSerial: body.startSerial
    });

    return NextResponse.json(prepared);
  } catch (error) {
    if (isCoreCandyMachineAdminInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error && error.message
      ? error.message
      : "Could not prepare Core Candy Machine deploy flow.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
