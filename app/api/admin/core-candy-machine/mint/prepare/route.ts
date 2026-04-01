import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  isCoreCandyMachineAdminInputError,
  prepareCoreCandyMachineMint,
  type PrepareCandyMachineMintInput
} from "@/lib/core-candy-machine-admin";

type PrepareMintRequestBody = Partial<Omit<PrepareCandyMachineMintInput, "payerPublicKey">>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as PrepareMintRequestBody | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const prepared = await prepareCoreCandyMachineMint({
      payerPublicKey: requestRole.pubkey,
      candyMachineAddress: body.candyMachineAddress ?? "",
      collectionAddress: body.collectionAddress ?? "",
      quantity: typeof body.quantity === "number" ? body.quantity : 0,
      serialOffset: body.serialOffset,
      enableOwnerFreezeDelegate: typeof body.enableOwnerFreezeDelegate === "boolean"
        ? body.enableOwnerFreezeDelegate
        : undefined
    });

    return NextResponse.json(prepared);
  } catch (error) {
    if (isCoreCandyMachineAdminInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not prepare Core Candy Machine mint flow." }, { status: 500 });
  }
}
