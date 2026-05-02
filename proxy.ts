import type { NextRequest } from "next/server";

import { handleAdminProxy } from "@/lib/auth-admin-proxy";

export async function proxy(request: NextRequest) {
  return handleAdminProxy(request);
}

export const config = {
  matcher: ["/admin/:path*"]
};
