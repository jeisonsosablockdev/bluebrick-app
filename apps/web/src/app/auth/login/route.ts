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
    authorizationUrl = await getSignInUrl();
  } catch (error) {
    console.error("WorkOS getSignInUrl error:", error);
    redirect("/dashboard");
  }

  if (authorizationUrl) {
    redirect(authorizationUrl);
  }

  redirect("/dashboard");
}
