/**
 * @file apps/web/src/middleware.ts
 * @description Layer 2: Application - WorkOS AuthKit Next.js 16 Edge Middleware.
 * Secures application routes and handles transparent session token refreshing.
 */

import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware();

export const config = {
  matcher: [
    // Step 1: Match all request paths except static files, favicon, images, and public assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
