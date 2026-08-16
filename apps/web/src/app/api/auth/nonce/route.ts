import { NextResponse } from "next/server";

import { setNonceCookie } from "@/lib/auth";
import { issueNonce } from "@/features/shared/auth/domain/auth-store";

export async function GET(): Promise<NextResponse> {
  const nonce = issueNonce();
  const response = NextResponse.json({ nonce });
  setNonceCookie(response, nonce);
  return response;
}
