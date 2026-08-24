/**
 * @file apps/web/src/middleware.ts
 * @description Layer 2: Application - WorkOS AuthKit Next.js 16 Edge Middleware.
 * Secures application routes and handles transparent session token refreshing when WorkOS credentials are configured.
 */

import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// Step 1: Detect if WorkOS credentials are fully configured in the environment
const isWorkOsConfigured = Boolean(
  process.env.WORKOS_COOKIE_PASSWORD &&
  process.env.WORKOS_CLIENT_ID &&
  process.env.WORKOS_API_KEY
);

// Step 2: Conditionally instantiate authkitMiddleware only when credentials exist, otherwise gracefully pass through
const authMiddlewareHandler = isWorkOsConfigured
  ? authkitMiddleware({
      redirectUri: process.env.WORKOS_REDIRECT_URI || "http://localhost:3000/callback",
    })
  : null;

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Step 3: If WorkOS is not configured, transparently pass request to downstream Next.js routes
  if (!authMiddlewareHandler) {
    return NextResponse.next();
  }

  return authMiddlewareHandler(request, event);
}

export const config = {
  matcher: [
    // Step 4: Match all request paths except static files, favicon, images, and public assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
