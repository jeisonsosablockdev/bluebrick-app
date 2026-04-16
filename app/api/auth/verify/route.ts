import { NextRequest, NextResponse } from "next/server";

import { clearNonceCookie, getNonceFromRequest, getRequestHost, setSessionCookie, verifySiwsPayload } from "@/lib/auth";
import { isWalletRegistered } from "@/lib/compliance/profile-repository";

type VerifyRequestBody = {
  message?: unknown;
  signature?: unknown;
  publicKey?: unknown;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => null)) as VerifyRequestBody | null;

  if (!body || typeof body.message !== "string" || typeof body.signature !== "string" || typeof body.publicKey !== "string") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const nonceFromCookie = getNonceFromRequest(request);
  const verification = verifySiwsPayload(
    {
      message: body.message,
      signature: body.signature,
      publicKey: body.publicKey
    },
    getRequestHost(request),
    nonceFromCookie
  );

  if (!verification.ok) {
    const errorResponse = NextResponse.json({ error: verification.error }, { status: verification.status });
    clearNonceCookie(errorResponse);
    return errorResponse;
  }

  const isNewUser = !(await isWalletRegistered(verification.publicKey));

  const response = NextResponse.json({ ok: true, publicKey: verification.publicKey, isNewUser });
  setSessionCookie(response, verification.sessionToken);
  clearNonceCookie(response);
  return response;
}
