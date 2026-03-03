import { NextRequest, NextResponse } from "next/server";

import { clearSessionCookie, revokeRequestSession } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  revokeRequestSession(request);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}

