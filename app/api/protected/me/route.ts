import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authenticatedPublicKey = getAuthenticatedPublicKeyFromRequest(request);

  if (!authenticatedPublicKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ publicKey: authenticatedPublicKey });
}

