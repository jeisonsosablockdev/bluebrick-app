import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";

import { isWorkosConfigured } from "@/lib/workos/config";

function resolveSafeReturnTo(request: NextRequest, fallbackPath: string): string {
  const candidate = request.nextUrl.searchParams.get("returnTo")?.trim();
  return candidate && candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : fallbackPath;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const returnTo = resolveSafeReturnTo(request, "/profile");

  if (!isWorkosConfigured()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const signInUrl = await getSignInUrl({ returnTo });
  return NextResponse.redirect(signInUrl);
}
