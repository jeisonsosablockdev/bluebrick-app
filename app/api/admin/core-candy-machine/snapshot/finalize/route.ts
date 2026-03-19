import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  finalizeCoreCandyMachineSnapshot,
  isCoreCandyMachineSnapshotError
} from "@/lib/core-candy-machine-snapshot-service";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const finalized = await finalizeCoreCandyMachineSnapshot(requestRole.pubkey, body);
    return NextResponse.json(finalized);
  } catch (error) {
    if (isCoreCandyMachineSnapshotError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    const message = error instanceof Error && error.message
      ? error.message
      : "Could not finalize mint snapshot.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
