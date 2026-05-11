import { signOut } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";

import { isWorkosConfigured } from "@/lib/workos/config";

function resolveSafeReturnTo(request: NextRequest, fallbackPath: string): string {
  const candidate = request.nextUrl.searchParams.get("returnTo")?.trim();
  return candidate && candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : fallbackPath;
}

export async function GET(request: NextRequest) {
  const returnTo = resolveSafeReturnTo(request, "/");

  if (!isWorkosConfigured()) {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  return signOut({ returnTo });
}
