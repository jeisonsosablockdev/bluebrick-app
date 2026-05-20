import { NextRequest, NextResponse } from "next/server";

import {
  clearFederatedLinkContextCookie,
  clearSessionCookie,
  clearWalletLinkContextCookie,
  getFederatedLinkContextFromRequest,
  getWalletLinkContextFromRequest,
  revokeRequestSession
} from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  revokeRequestSession(request);
  const linkContext = getWalletLinkContextFromRequest(request);
  const federatedLinkContext = getFederatedLinkContextFromRequest(request);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  clearWalletLinkContextCookie(response, linkContext?.contextId ?? null);
  clearFederatedLinkContextCookie(response, federatedLinkContext?.contextId ?? null);
  return response;
}
