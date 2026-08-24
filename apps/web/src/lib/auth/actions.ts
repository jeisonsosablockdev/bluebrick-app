/**
 * @file apps/web/src/lib/auth/actions.ts
 * @description Layer 2: Application - Server actions for WorkOS AuthKit authentication flows.
 * Handles server-side PKCE state generation and redirection to Google / WorkOS AuthKit.
 */

"use server";

import { redirect } from "next/navigation";
import { getSignInUrl, signOut } from "@workos-inc/authkit-nextjs";

/**
 * Initiates the Google OAuth / AuthKit sign-in flow.
 */
export async function signInWithGoogleAction(): Promise<void> {
  // Step 1: Check if WorkOS credentials are configured
  const isConfigured = Boolean(
    process.env.WORKOS_COOKIE_PASSWORD &&
    process.env.WORKOS_CLIENT_ID &&
    process.env.WORKOS_API_KEY
  );

  if (!isConfigured) {
    // Invariant: If unconfigured in local dev, seamlessly redirect to demo dashboard
    redirect("/dashboard");
  }

  let authorizationUrl: string | null = null;

  try {
    // Step 2: Generate PKCE-sealed authorization sign-in URL
    authorizationUrl = await getSignInUrl();
  } catch (error) {
    console.warn("WorkOS getSignInUrl fallback:", error);
    redirect("/dashboard");
  }

  // Step 3: Redirect user to WorkOS AuthKit Google login
  if (authorizationUrl) {
    redirect(authorizationUrl);
  }

  redirect("/dashboard");
}

/**
 * Server action for terminating authenticated session.
 */
export async function signOutAction(): Promise<void> {
  // Step 1: Invoke WorkOS signOut to clear encrypted session cookie
  await signOut();
}
