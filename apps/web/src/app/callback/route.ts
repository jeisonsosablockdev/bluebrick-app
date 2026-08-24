/**
 * @file apps/web/src/app/callback/route.ts
 * @description Layer 2: Application - WorkOS AuthKit OAuth callback handler route.
 * Handles the authorization code exchange and sets the encrypted session cookie.
 */

import { handleAuth } from "@workos-inc/authkit-nextjs";

// Step 1: Export GET handler for OAuth code-to-session exchange, redirecting to /dashboard upon success
export const GET = handleAuth({
  returnPathname: "/dashboard",
});
