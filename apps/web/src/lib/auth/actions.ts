/**
 * @file apps/web/src/lib/auth/actions.ts
 * @description Layer 2: Application - Server actions for WorkOS AuthKit authentication flows.
 * Handles server-side PKCE state generation for universal email login and session termination.
 */

"use server";

import { redirect } from "next/navigation";
import { getSignInUrl, signOut } from "@workos-inc/authkit-nextjs";

/**
 * Initiates universal email / passwordless / SSO sign-in flow via WorkOS AuthKit.
 * Supports any email provider (Gmail, Outlook, corporate domains, SSO).
 */
export async function signInWithEmailAction(): Promise<void> {
  let authorizationUrl: string | null = null;

  try {
    // Step 1: Request PKCE-sealed universal AuthKit authorization URL
    authorizationUrl = await getSignInUrl();
  } catch (error) {
    try {
      authorizationUrl = await getSignInUrl();
    } catch (fallbackError) {
      console.warn("WorkOS universal sign-in redirect fallback:", error, fallbackError);
      redirect("/dashboard");
    }
  }

  // Step 2: Redirect user directly to WorkOS universal authentication hosted UI
  if (authorizationUrl) {
    redirect(authorizationUrl);
  }

  redirect("/dashboard");
}

/**
 * Initiates the Google OAuth sign-in flow directly via WorkOS AuthKit (legacy / provider-specific).
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
 * Server action for terminating authenticated investor session.
 */
export async function signOutAction(): Promise<void> {
  // Step 1: Invoke WorkOS signOut to clear encrypted session cookie
  await signOut();
}
