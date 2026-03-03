import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestRole = getRequestRole(request);

  if (!requestRole.authenticated || requestRole.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, role: requestRole.role, pubkey: requestRole.pubkey });
}
