import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin" || !requestRole.pubkey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    {
      error: "Admin mint prepare is disabled. User-owned BRIDS NFTs must be minted through marketplace purchase prepare/submit."
    },
    { status: 410 }
  );
}
