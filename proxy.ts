import { authkitProxy } from "@workos-inc/authkit-nextjs";
import { NextResponse, type NextRequest } from "next/server";

import { handleAdminProxy } from "@/lib/auth-admin-proxy";
import { isWorkosConfigured } from "@/lib/workos/config";

const handleWorkosProxy = authkitProxy();

export async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname.startsWith("/profile") ||
    request.nextUrl.pathname.startsWith("/protected") ||
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/api/protected")
  ) {
    if (!isWorkosConfigured()) {
      return NextResponse.next();
    }

    return handleWorkosProxy(request, {} as never);
  }

  return handleAdminProxy(request);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile",
    "/profile/:path*",
    "/protected",
    "/protected/:path*",
    "/api/auth/:path*",
    "/api/protected/:path*"
  ]
};

