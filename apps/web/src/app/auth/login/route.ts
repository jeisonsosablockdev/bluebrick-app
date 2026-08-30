/**
 * @file apps/web/src/app/auth/login/route.ts
 * @description Layer 2: Application - WorkOS AuthKit Sign-in Redirect Route Handler.
 * Generates PKCE authorization URL using dynamic origin / port detection and redirects to WorkOS.
 */

import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";

export async function GET(request: NextRequest): Promise<void> {
  // Step 1: Detect dynamic origin (e.g. port 3001 or 3000) for seamless local dev
  const origin = request.nextUrl.origin;
  const redirectUri = process.env.WORKOS_REDIRECT_URI || `${origin}/callback`;

  let authorizationUrl: string | null = null;

  try {
    // Step 2: Request PKCE sign-in URL with explicit redirect URI and maxAge: 0 to force fresh authentication
    authorizationUrl = await getSignInUrl({
      redirectUri,
      maxAge: 0,
    });
  } catch (error) {
    try {
      authorizationUrl = await getSignInUrl({ maxAge: 0 });
    } catch (fallbackErr) {
      console.error("WorkOS getSignInUrl error:", error, fallbackErr);
      redirect("/dashboard");
    }
  }

  // Step 3: Redirect user to WorkOS authorization screen
  if (authorizationUrl) {
    redirect(authorizationUrl);
  }

  redirect("/dashboard");
}
