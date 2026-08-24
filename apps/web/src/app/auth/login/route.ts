/**
 * @file apps/web/src/app/auth/login/route.ts
 * @description Layer 2: Application - WorkOS AuthKit Sign-in Redirect Route Handler.
 * Generates PKCE authorization URL and redirects user to Google / WorkOS sign-in page.
 */

import { redirect } from "next/navigation";
import { getSignInUrl } from "@workos-inc/authkit-nextjs";

export async function GET(): Promise<void> {
  // Step 1: Check if WorkOS credentials are fully configured
  const isConfigured = Boolean(
    process.env.WORKOS_COOKIE_PASSWORD &&
    process.env.WORKOS_CLIENT_ID &&
    process.env.WORKOS_API_KEY
  );

  if (!isConfigured) {
    // Invariant: In development or demo mode without WorkOS keys, smoothly fall back to dashboard
    redirect("/dashboard");
  }

  let authorizationUrl: string | null = null;

  try {
    // Step 2: Obtain PKCE authorization URL from AuthKit SDK
    authorizationUrl = await getSignInUrl();
  } catch (error) {
    console.warn("WorkOS sign-in redirect fallback:", error);
    redirect("/dashboard");
  }

  // Step 3: Redirect to WorkOS Google / AuthKit login
  if (authorizationUrl) {
    redirect(authorizationUrl);
  }

  redirect("/dashboard");
}
