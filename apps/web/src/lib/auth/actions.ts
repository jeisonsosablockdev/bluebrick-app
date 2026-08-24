/**
 * @file apps/web/src/lib/auth/actions.ts
 * @description Layer 2: Application - Server actions for WorkOS AuthKit authentication flows.
 * Handles server-side PKCE state generation and direct redirection to Google OAuth.
 */

"use server";

import { redirect } from "next/navigation";
import { getSignInUrl, signOut } from "@workos-inc/authkit-nextjs";

/**
 * Initiates the Google OAuth sign-in flow directly via WorkOS AuthKit.
 */
export async function signInWithGoogleAction(): Promise<void> {
  let authorizationUrl: string | null = null;

  try {
    // Step 1: Request PKCE-sealed Google OAuth authorization URL
    authorizationUrl = await getSignInUrl({
      provider: "GoogleOAuth",
    } as Parameters<typeof getSignInUrl>[0]);
  } catch (error) {
    try {
      authorizationUrl = await getSignInUrl();
    } catch (fallbackError) {
      console.warn("WorkOS sign-in redirect fallback:", error, fallbackError);
      redirect("/dashboard");
    }
  }

  // Step 2: Redirect user directly to Google OAuth consent screen
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
