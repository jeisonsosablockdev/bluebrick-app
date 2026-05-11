import { NextRequest, NextResponse } from "next/server";

import { clearSessionCookie, clearWalletLinkContextCookie, getWalletLinkContextFromRequest, revokeRequestSession } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  revokeRequestSession(request);
  const linkContext = getWalletLinkContextFromRequest(request);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  clearWalletLinkContextCookie(response, linkContext?.contextId ?? null);
  return response;
}
