import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated) {
    return NextResponse.json({ authenticated: false, pubkey: null });
  }

  return NextResponse.json({
    authenticated: true,
    pubkey: requestRole.pubkey,
    role: requestRole.role
  });
}
