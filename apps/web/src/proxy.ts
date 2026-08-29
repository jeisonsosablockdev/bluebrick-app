/**
 * @file apps/web/src/proxy.ts
 * @description Layer 2: Application - WorkOS AuthKit Next.js 16 Edge Proxy.
 * Secures application routes and handles transparent session token refreshing when WorkOS credentials are configured.
 * Conforms to Next.js 16 proxy file convention.
 */

import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

/**
 * Next.js 16 Edge Proxy handler for transparent session authentication.
 *
 * @param request - Inbound HTTP request from Next.js runtime.
 * @param event - Next.js fetch event for background tasks.
 * @returns {Promise<NextResponse>} Processed downstream response with session headers.
 */
export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Step 1: Detect if WorkOS credentials are fully configured in the environment
  const isWorkOsConfigured = Boolean(
    process.env.WORKOS_COOKIE_PASSWORD &&
    process.env.WORKOS_CLIENT_ID &&
    process.env.WORKOS_API_KEY
  );

  // Step 2: If WorkOS is not configured, transparently pass request to downstream Next.js routes
  if (!isWorkOsConfigured) {
    return NextResponse.next();
  }

  // Step 3: Handle WorkOS session cookies and token refreshing
  const handler = authkitMiddleware({
    redirectUri: process.env.WORKOS_REDIRECT_URI || "http://localhost:3001/callback",
  });

  return handler(request, event);
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
