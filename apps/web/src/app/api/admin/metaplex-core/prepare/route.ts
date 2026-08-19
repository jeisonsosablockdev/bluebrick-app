import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  isMetaplexCoreAdminInputError,
  prepareMetaplexCoreBatch,
  type PrepareMetaplexCoreBatchInput
} from "@/lib/metaplex-core-admin";

type PrepareRequestBody = Partial<PrepareMetaplexCoreBatchInput>;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as PrepareRequestBody | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const prepared = await prepareMetaplexCoreBatch({
      payerPublicKey: requestRole.pubkey,
      collectionName: body.collectionName ?? "",
      collectionUri: body.collectionUri ?? "",
      assetNamePrefix: body.assetNamePrefix ?? "",
      assetUri: body.assetUri ?? "",
      totalItems: body.totalItems ?? 0,
      startSerial: body.startSerial
    });

    return NextResponse.json(prepared);
  } catch (error) {
    if (isMetaplexCoreAdminInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not prepare mint batch." }, { status: 500 });
  }
}
