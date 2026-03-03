import { NextResponse } from "next/server";

import { issueNonce } from "@/lib/auth-store";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ nonce: issueNonce() });
}

