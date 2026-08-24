/**
 * @file apps/web/src/app/auth/login/route.ts
 * @description Layer 2: Application - WorkOS AuthKit Sign-in Redirect Route Handler.
 * Generates PKCE authorization URL and redirects user directly to Google OAuth / WorkOS sign-in page.
 */

import { redirect } from "next/navigation";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";

export async function GET(): Promise<void> {
  let authorizationUrl: string | null = null;

  try {
    // Step 1: Request PKCE-sealed Google OAuth authorization URL from WorkOS AuthKit
    authorizationUrl = await getSignInUrl({
      provider: "GoogleOAuth",
    } as Parameters<typeof getSignInUrl>[0]);
  } catch (error) {
    try {
      // Step 2: Fallback to general AuthKit sign-in URL if provider param is handled at dashboard level
      authorizationUrl = await getSignInUrl();
    } catch (fallbackError) {
      console.warn("WorkOS getSignInUrl fallback:", error, fallbackError);
      redirect("/dashboard");
    }
  }

  // Step 3: Redirect user directly to Google / WorkOS OAuth screen
  if (authorizationUrl) {
    redirect(authorizationUrl);
  }

  redirect("/dashboard");
}
